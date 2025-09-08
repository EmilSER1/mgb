
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface TurarData {
  'Отделение/Блок': string
  'Помещение/Кабинет': string
  'Код оборудования': string
  'Наименование': string
  'Кол-во': number | string
}

export async function POST() {
  try {
    // Очищаем старые данные Турар
    await prisma.turarEquipment.deleteMany({})
    await prisma.turarRoom.deleteMany({})
    await prisma.turarDepartment.deleteMany({})

    // Читаем новые данные
    const filePath = path.join(process.cwd(), 'data', 'turar.json')
    const jsonData = await readFile(filePath, 'utf-8')
    const turarData: TurarData[] = JSON.parse(jsonData)

    // Группируем данные по отделениям и кабинетам
    const departmentsMap = new Map<string, Map<string, TurarData[]>>()

    turarData.forEach((item) => {
      const departmentName = item['Отделение/Блок']
      const roomName = item['Помещение/Кабинет']

      if (!departmentsMap.has(departmentName)) {
        departmentsMap.set(departmentName, new Map())
      }

      const departmentRooms = departmentsMap.get(departmentName)!
      if (!departmentRooms.has(roomName)) {
        departmentRooms.set(roomName, [])
      }

      departmentRooms.get(roomName)!.push(item)
    })

    // Создаем новые записи в базе
    for (const [departmentName, roomsMap] of departmentsMap) {
      const department = await prisma.turarDepartment.create({
        data: {
          name: departmentName,
        }
      })

      for (const [roomName, equipmentList] of roomsMap) {
        const room = await prisma.turarRoom.create({
          data: {
            name: roomName,
            departmentId: department.id,
          }
        })

        for (const equipment of equipmentList) {
          let quantity = 1
          const kolvo = equipment['Кол-во']
          
          if (typeof kolvo === 'number') {
            quantity = kolvo
          } else if (typeof kolvo === 'string') {
            if (kolvo === 'ПТ') {
              quantity = 1
            } else {
              const parsed = parseInt(kolvo)
              quantity = isNaN(parsed) ? 1 : parsed
            }
          }

          await prisma.turarEquipment.create({
            data: {
              code: equipment['Код оборудования'] || '',
              name: equipment['Наименование'] || '',
              quantity: quantity,
              roomId: room.id,
            }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Загружено ${turarData.length} единиц оборудования в ${departmentsMap.size} отделений`,
      departmentsCount: departmentsMap.size,
      equipmentCount: turarData.length
    })

  } catch (error) {
    console.error('Ошибка при загрузке данных Турар:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при загрузке данных',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
