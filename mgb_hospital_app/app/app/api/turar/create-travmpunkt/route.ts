
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Проверяем, существует ли уже Травмпункт
    let travmpunkt = await prisma.turarDepartment.findFirst({
      where: {
        name: 'Травмпункт'
      }
    })

    if (!travmpunkt) {
      // Создаем отделение Травмпункт
      travmpunkt = await prisma.turarDepartment.create({
        data: {
          name: 'Травмпункт',
          description: 'Травматологический пункт на 30 кабинетов'
        }
      })
    }

    // Проверяем, есть ли уже кабинеты
    const existingRooms = await prisma.turarRoom.count({
      where: {
        departmentId: travmpunkt.id
      }
    })

    if (existingRooms === 0) {
      // Создаем 30 кабинетов
      const rooms = []
      for (let i = 1; i <= 30; i++) {
        rooms.push({
          name: `Кабинет травматологии ${i.toString().padStart(2, '0')}`,
          description: `Травматологический кабинет №${i}`,
          departmentId: travmpunkt.id
        })
      }

      await prisma.turarRoom.createMany({
        data: rooms
      })

      // Добавляем базовое оборудование в некоторые кабинеты
      const createdRooms = await prisma.turarRoom.findMany({
        where: {
          departmentId: travmpunkt.id
        }
      })

      const equipmentData: any[] = []
      createdRooms.forEach((room, index) => {
        // Базовое оборудование для всех кабинетов
        equipmentData.push({
          code: `TP-${(index + 1).toString().padStart(3, '0')}-001`,
          name: 'Кушетка медицинская',
          quantity: 1,
          roomId: room.id
        })

        equipmentData.push({
          code: `TP-${(index + 1).toString().padStart(3, '0')}-002`,
          name: 'Стол медицинский',
          quantity: 1,
          roomId: room.id
        })

        equipmentData.push({
          code: `TP-${(index + 1).toString().padStart(3, '0')}-003`,
          name: 'Стул медицинский',
          quantity: 2,
          roomId: room.id
        })

        // Дополнительное оборудование для некоторых кабинетов
        if (index < 10) {
          equipmentData.push({
            code: `TP-${(index + 1).toString().padStart(3, '0')}-004`,
            name: 'Рентгеновский аппарат передвижной',
            quantity: 1,
            roomId: room.id
          })
        }

        if (index < 5) {
          equipmentData.push({
            code: `TP-${(index + 1).toString().padStart(3, '0')}-005`,
            name: 'УЗИ-аппарат',
            quantity: 1,
            roomId: room.id
          })
        }
      })

      await prisma.turarEquipment.createMany({
        data: equipmentData
      })
    }

    // Получаем полную информацию о созданном отделении
    const fullTravmpunkt = await prisma.turarDepartment.findFirst({
      where: {
        id: travmpunkt.id
      },
      include: {
        rooms: {
          include: {
            equipment: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Травмпункт успешно создан/обновлен',
      department: fullTravmpunkt,
      stats: {
        rooms: fullTravmpunkt?.rooms?.length || 0,
        equipment: fullTravmpunkt?.rooms?.reduce((acc, room) => acc + (room.equipment?.length || 0), 0) || 0
      }
    })

  } catch (error) {
    console.error('Ошибка при создании Травмпункта:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при создании Травмпункта',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
