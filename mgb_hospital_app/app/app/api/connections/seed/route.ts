
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { readFile } from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

interface MappingData {
  'ОТДЕЛЕНИЕ Проектировщики': string
  'Отделения Турар': string
}

export async function POST() {
  try {
    // Очищаем старые данные сопоставлений
    await prisma.departmentMapping.deleteMany({})

    // Читаем данные сопоставлений из нового файла без дублей
    const filePath = path.join(process.cwd(), 'data', 'proektturar_dedup.json')
    const jsonData = await readFile(filePath, 'utf-8')
    const mappingData: MappingData[] = JSON.parse(jsonData)

    // Создаем уникальные сопоставления
    const mappings = new Map<string, string>()
    
    mappingData.forEach((mapping) => {
      const turarDept = mapping['Отделения Турар']?.trim()
      const projectDept = mapping['ОТДЕЛЕНИЕ Проектировщики']?.trim()
      
      // Сохраняем только валидные сопоставления (не null с обеих сторон)
      if (turarDept && projectDept) {
        // Создаем уникальный ключ для каждой пары
        const key = `${turarDept}|||${projectDept}`
        mappings.set(key, `${turarDept} -> ${projectDept}`)
      }
    })

    // Создаем записи в базе из уникальных пар
    const createdMappings = []
    
    for (const mapping of mappingData) {
      const turarDept = mapping['Отделения Турар']?.trim()
      const projectDept = mapping['ОТДЕЛЕНИЕ Проектировщики']?.trim()
      
      // Создаем запись только для валидных сопоставлений
      if (turarDept && projectDept) {
        try {
          const createdMapping = await prisma.departmentMapping.create({
            data: {
              turarDepartmentName: turarDept,
              projectDepartmentName: projectDept,
            }
          })
          createdMappings.push(createdMapping)
        } catch (error) {
          // Игнорируем дубли, если они есть
          console.log(`Пропущено дублированное сопоставление: ${turarDept} -> ${projectDept}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Загружено ${createdMappings.length} уникальных сопоставлений отделений`,
      mappingsCount: createdMappings.length,
      mappings: createdMappings
    })

  } catch (error) {
    console.error('Ошибка при загрузке данных сопоставлений:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при загрузке данных сопоставлений',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
