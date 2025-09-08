
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Получаем все сопоставления
    const mappings = await prisma.departmentMapping.findMany({
      orderBy: {
        turarDepartmentName: 'asc'
      }
    })

    // Получаем данные из Турар
    const turarDepartments = await prisma.turarDepartment.findMany({
      include: {
        rooms: {
          include: {
            equipment: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Получаем данные из Проектировщиков
    const projectDepartments = await prisma.department.findMany({
      include: {
        rooms: {
          include: {
            equipment: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      mappings,
      turarDepartments,
      projectDepartments
    })

  } catch (error) {
    console.error('Ошибка при получении данных соединений:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при получении данных соединений',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
