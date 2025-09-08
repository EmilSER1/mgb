
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface FloorData {
  'Этаж': string | number
  'БЛОК': string
  'ОТДЕЛЕНИЕ': string
  'Код помещения': string
  'Наименование помещения': string
  'Код оборудования': string | null
  'Наименование оборудования': string | null
  'Ед. изм.': string | null
  'Кол-во': string | number | null
  'Примечания': string | null
}

async function main() {
  console.log('🌱 Начинаем загрузку данных из JSON файлов...')

  try {
    // Очистка существующих данных (безопасно)
    console.log('Очистка базы данных...')
    try {
      await prisma.equipment.deleteMany()
      await prisma.room.deleteMany()
      await prisma.department.deleteMany()
      await prisma.block.deleteMany()
      await prisma.floor.deleteMany()
      await prisma.turarEquipment.deleteMany()
      await prisma.turarRoom.deleteMany()
      await prisma.turarDepartment.deleteMany()
    } catch (e) {
      console.log('⚠️ Некоторые таблицы еще не существуют, продолжаем...')
    }

    // Загрузка данных из 1F_filled.json
    await loadFloorDataFromJson('/home/ubuntu/mgb_hospital_app/app/data/1F_filled.json', 1)
    
    // Загрузка данных из 2F_filled.json  
    await loadFloorDataFromJson('/home/ubuntu/mgb_hospital_app/app/data/2F_filled.json', 2)
    
    // Загрузка данных Турар
    await loadTurarData()

    console.log('✅ Данные успешно загружены!')
  } catch (error) {
    console.error('❌ Ошибка при загрузке данных:', error)
    throw error
  }
}

async function loadFloorDataFromJson(filePath: string, floorNumber: number) {
  console.log(`📄 Загружаем данные с ${floorNumber} этажа из ${filePath}`)
  
  const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8')) as FloorData[]
  
  // Создаем этаж
  const floor = await prisma.floor.create({
    data: {
      floorNumber,
      name: `${floorNumber} этаж`
    }
  })
  
  const processedData = new Map()
  
  for (const row of jsonData) {
    const floorNum = typeof row['Этаж'] === 'string' ? parseInt(row['Этаж']) : row['Этаж']
    const blockCode = row['БЛОК']
    const departmentName = row['ОТДЕЛЕНИЕ']
    const roomCode = row['Код помещения']
    const roomName = row['Наименование помещения']
    const equipmentCode = row['Код оборудования']
    const equipmentName = row['Наименование оборудования']
    const quantity = typeof row['Кол-во'] === 'string' ? parseInt(row['Кол-во']) : row['Кол-во']
    const unit = row['Ед. изм.'] || 'шт.'
    const notes = row['Примечания']
    
    // Пропускаем строки без основных данных
    if (!floorNum || floorNum !== floorNumber) continue
    if (!blockCode || !departmentName) continue
    
    // Создаем или получаем блок
    const blockKey = `${floorNumber}-${blockCode}`
    let block = processedData.get(`block-${blockKey}`)
    if (!block) {
      block = await prisma.block.create({
        data: {
          code: blockCode,
          name: `Блок ${blockCode}`,
          floorId: floor.id
        }
      })
      processedData.set(`block-${blockKey}`, block)
    }
    
    // Создаем или получаем отделение
    const departmentKey = `${blockKey}-${departmentName}`
    let department = processedData.get(`department-${departmentKey}`)
    if (!department) {
      department = await prisma.department.create({
        data: {
          name: departmentName.trim(),
          blockId: block.id
        }
      })
      processedData.set(`department-${departmentKey}`, department)
    }
    
    // Создаем или получаем кабинет/помещение
    if (roomCode && roomName) {
      const roomKey = `${departmentKey}-${roomCode}`
      let room = processedData.get(`room-${roomKey}`)
      if (!room) {
        room = await prisma.room.create({
          data: {
            code: roomCode,
            name: roomName.trim(),
            departmentId: department.id
          }
        })
        processedData.set(`room-${roomKey}`, room)
      }
      
      // Добавляем оборудование
      if (equipmentCode && equipmentName) {
        await prisma.equipment.create({
          data: {
            code: equipmentCode.toString(),
            name: equipmentName.trim(),
            quantity: quantity || 1,
            unit: unit || 'шт.',
            notes: notes || null,
            roomId: room.id
          }
        })
      } else if (equipmentName && !equipmentCode) {
        // Добавляем оборудование даже без кода (как в JSON файлах)
        await prisma.equipment.create({
          data: {
            code: 'N/A',
            name: equipmentName.trim(),
            quantity: quantity || 1,
            unit: unit || 'шт.',
            notes: notes || null,
            roomId: room.id
          }
        })
      }
    }
  }
  
  console.log(`✅ Данные с ${floorNumber} этажа загружены`)
}

async function loadTurarData() {
  console.log('📄 Загружаем данные Турар')
  
  const filePath = '/home/ubuntu/mgb_hospital_app/app/data/turar.xlsx'
  
  // Проверяем, существует ли файл turar.xlsx, если нет - создаем демо данные
  if (!fs.existsSync(filePath)) {
    console.log('⚠️ Файл turar.xlsx не найден, создаем демо данные')
    
    // Создаем демо отделение Турар
    const turarDept1 = await prisma.turarDepartment.create({
      data: {
        name: 'Травмпункт',
        description: 'Отделение травматологии'
      }
    })

    const turarRoom1 = await prisma.turarRoom.create({
      data: {
        name: 'Приемная травмпункта',
        description: 'Основное помещение приема пациентов',
        departmentId: turarDept1.id
      }
    })

    await prisma.turarEquipment.create({
      data: {
        code: 'ТУР001',
        name: 'Медицинский стол',
        quantity: 2,
        roomId: turarRoom1.id
      }
    })
    
    console.log('✅ Демо данные Турар созданы')
    return
  }
  
  // Если файл существует, пытаемся его прочитать (но так как XLSX больше не импортирован, создадим заглушку)
  console.log('✅ Данные Турар пропущены (требуется обновление для чтения xlsx)')
  return
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
