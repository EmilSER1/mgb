
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface Equipment {
  code: string
  name: string
  quantity: number
}

interface Room {
  name: string
  code?: string
  area?: number
  equipment?: Equipment[]
}

interface Department {
  name: string
  rooms?: Room[]
}

interface Floor {
  name: string
  blocks?: {
    name: string
    code?: string
    departments?: Department[]
  }[]
}

// Экспорт данных Проектировщики (этажи)
export const exportFloorsToExcel = (floors: Floor[]) => {
  const wb = XLSX.utils.book_new()
  
  // Лист 1: Общая структура
  const structureData: any[][] = [
    ['Этаж', 'Блок', 'Код блока', 'Отделение', 'Кабинет', 'Код кабинета', 'Площадь', 'Количество оборудования']
  ]
  
  floors.forEach(floor => {
    floor.blocks?.forEach(block => {
      block.departments?.forEach(dept => {
        if (dept.rooms && dept.rooms.length > 0) {
          dept.rooms.forEach(room => {
            structureData.push([
              floor.name,
              block.name,
              block.code || '',
              dept.name,
              room.name,
              room.code || '',
              room.area || '',
              room.equipment?.length || 0
            ])
          })
        } else {
          structureData.push([
            floor.name,
            block.name,
            block.code || '',
            dept.name,
            '',
            '',
            '',
            0
          ])
        }
      })
    })
  })
  
  const ws1 = XLSX.utils.aoa_to_sheet(structureData)
  XLSX.utils.book_append_sheet(wb, ws1, 'Структура')
  
  // Лист 2: Оборудование
  const equipmentData: any[][] = [
    ['Этаж', 'Блок', 'Отделение', 'Кабинет', 'Код оборудования', 'Наименование', 'Количество']
  ]
  
  floors.forEach(floor => {
    floor.blocks?.forEach(block => {
      block.departments?.forEach(dept => {
        dept.rooms?.forEach(room => {
          if (room.equipment && room.equipment.length > 0) {
            room.equipment.forEach(eq => {
              equipmentData.push([
                floor.name,
                block.name,
                dept.name,
                room.name,
                eq.code,
                eq.name,
                eq.quantity
              ])
            })
          }
        })
      })
    })
  })
  
  const ws2 = XLSX.utils.aoa_to_sheet(equipmentData)
  XLSX.utils.book_append_sheet(wb, ws2, 'Оборудование')
  
  // Лист 3: Статистика
  const statsData: any[][] = [
    ['Показатель', 'Значение'],
    ['Общее количество этажей', floors.length],
    ['Общее количество блоков', floors.reduce((acc, floor) => acc + (floor.blocks?.length || 0), 0)],
    ['Общее количество отделений', floors.reduce((acc, floor) => 
      acc + (floor.blocks?.reduce((blockAcc, block) => 
        blockAcc + (block.departments?.length || 0), 0) || 0), 0)],
    ['Общее количество кабинетов', floors.reduce((acc, floor) => 
      acc + (floor.blocks?.reduce((blockAcc, block) => 
        blockAcc + (block.departments?.reduce((deptAcc, dept) => 
          deptAcc + (dept.rooms?.length || 0), 0) || 0), 0) || 0), 0)],
    ['Общее количество оборудования', floors.reduce((acc, floor) => 
      acc + (floor.blocks?.reduce((blockAcc, block) => 
        blockAcc + (block.departments?.reduce((deptAcc, dept) => 
          deptAcc + (dept.rooms?.reduce((roomAcc, room) => 
            roomAcc + (room.equipment?.reduce((eqAcc, eq) => eqAcc + eq.quantity, 0) || 0), 0) || 0), 0) || 0), 0) || 0), 0)]
  ]
  
  const ws3 = XLSX.utils.aoa_to_sheet(statsData)
  XLSX.utils.book_append_sheet(wb, ws3, 'Статистика')
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `МГБ_Проектировщики_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Экспорт данных Турар
export const exportTurarToExcel = (departments: Department[]) => {
  const wb = XLSX.utils.book_new()
  
  // Лист 1: Структура отделений
  const structureData: any[][] = [
    ['Отделение', 'Кабинет', 'Количество оборудования']
  ]
  
  departments.forEach(dept => {
    if (dept.rooms && dept.rooms.length > 0) {
      dept.rooms.forEach(room => {
        structureData.push([
          dept.name,
          room.name,
          room.equipment?.length || 0
        ])
      })
    } else {
      structureData.push([dept.name, '', 0])
    }
  })
  
  const ws1 = XLSX.utils.aoa_to_sheet(structureData)
  XLSX.utils.book_append_sheet(wb, ws1, 'Отделения и кабинеты')
  
  // Лист 2: Оборудование с кодами
  const equipmentData: any[][] = [
    ['Отделение', 'Кабинет', 'Код оборудования', 'Наименование', 'Количество']
  ]
  
  departments.forEach(dept => {
    dept.rooms?.forEach(room => {
      if (room.equipment && room.equipment.length > 0) {
        room.equipment.forEach(eq => {
          equipmentData.push([
            dept.name,
            room.name,
            eq.code,
            eq.name,
            eq.quantity
          ])
        })
      }
    })
  })
  
  const ws2 = XLSX.utils.aoa_to_sheet(equipmentData)
  XLSX.utils.book_append_sheet(wb, ws2, 'Оборудование')
  
  // Лист 3: Статистика
  const statsData: any[][] = [
    ['Показатель', 'Значение'],
    ['Общее количество отделений', departments.length],
    ['Общее количество кабинетов', departments.reduce((acc, dept) => acc + (dept.rooms?.length || 0), 0)],
    ['Общее количество единиц оборудования', departments.reduce((acc, dept) => 
      acc + (dept.rooms?.reduce((roomAcc, room) => 
        roomAcc + (room.equipment?.reduce((eqAcc, eq) => eqAcc + eq.quantity, 0) || 0), 0) || 0), 0)]
  ]
  
  const ws3 = XLSX.utils.aoa_to_sheet(statsData)
  XLSX.utils.book_append_sheet(wb, ws3, 'Статистика')
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `МГБ_Турар_${new Date().toISOString().split('T')[0]}.xlsx`)
}

// Экспорт таблицы соединений
export const exportConnectionsToExcel = (
  mappings: any[], 
  turarDepartments: Department[], 
  projectDepartments: Department[]
) => {
  const wb = XLSX.utils.book_new()
  
  // Лист 1: Сопоставления отделений
  const mappingsData: any[][] = [
    ['Отделение Турар', 'Отделение Проектировщики', 'Кабинетов в Турар', 'Кабинетов в Проектировщики']
  ]
  
  mappings.forEach(mapping => {
    const turarDept = turarDepartments.find(d => d.name === mapping.turarDepartmentName)
    const projectDept = projectDepartments.find(d => d.name === mapping.projectDepartmentName)
    
    mappingsData.push([
      mapping.turarDepartmentName,
      mapping.projectDepartmentName,
      turarDept?.rooms?.length || 0,
      projectDept?.rooms?.length || 0
    ])
  })
  
  const ws1 = XLSX.utils.aoa_to_sheet(mappingsData)
  XLSX.utils.book_append_sheet(wb, ws1, 'Сопоставления')
  
  // Лист 2: Детализация кабинетов
  const detailData: any[][] = [
    ['Система', 'Отделение', 'Кабинет', 'Количество оборудования', 'Связанное отделение']
  ]
  
  mappings.forEach(mapping => {
    const turarDept = turarDepartments.find(d => d.name === mapping.turarDepartmentName)
    const projectDept = projectDepartments.find(d => d.name === mapping.projectDepartmentName)
    
    // Турар кабинеты
    turarDept?.rooms?.forEach(room => {
      detailData.push([
        'Турар',
        turarDept.name,
        room.name,
        room.equipment?.length || 0,
        mapping.projectDepartmentName
      ])
    })
    
    // Проектировщики кабинеты
    projectDept?.rooms?.forEach(room => {
      detailData.push([
        'Проектировщики',
        projectDept.name,
        room.name,
        room.equipment?.length || 0,
        mapping.turarDepartmentName
      ])
    })
  })
  
  const ws2 = XLSX.utils.aoa_to_sheet(detailData)
  XLSX.utils.book_append_sheet(wb, ws2, 'Детализация')
  
  // Лист 3: Статистика
  const statsData: any[][] = [
    ['Показатель', 'Значение'],
    ['Количество сопоставлений', mappings.length],
    ['Отделений в Турар', turarDepartments.length],
    ['Отделений в Проектировщики', projectDepartments.length],
    ['Несопоставленных отделений Турар', turarDepartments.length - mappings.length],
    ['Несопоставленных отделений Проектировщики', projectDepartments.length - mappings.length]
  ]
  
  const ws3 = XLSX.utils.aoa_to_sheet(statsData)
  XLSX.utils.book_append_sheet(wb, ws3, 'Статистика')
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, `МГБ_Таблица_соединений_${new Date().toISOString().split('T')[0]}.xlsx`)
}
