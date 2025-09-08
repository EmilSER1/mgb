
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - создать новое сопоставление отделений
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { turarDepartmentName, projectDepartmentName } = body

    if (!turarDepartmentName || !projectDepartmentName) {
      return NextResponse.json(
        { success: false, error: 'Не указаны названия отделений' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли уже такая связь
    const existingMapping = await prisma.departmentMapping.findFirst({
      where: {
        turarDepartmentName,
        projectDepartmentName
      }
    })

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Связь уже существует' },
        { status: 400 }
      )
    }

    const departmentMapping = await prisma.departmentMapping.create({
      data: {
        turarDepartmentName,
        projectDepartmentName
      }
    })

    return NextResponse.json({
      success: true,
      departmentMapping,
      message: 'Связь отделений создана'
    })
  } catch (error) {
    console.error('Ошибка при создании связи отделений:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при создании связи отделений' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - удалить сопоставление отделений
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { mappingId } = body

    if (!mappingId) {
      return NextResponse.json(
        { success: false, error: 'Не указан ID связи' },
        { status: 400 }
      )
    }

    await prisma.departmentMapping.delete({
      where: {
        id: mappingId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Связь отделений удалена'
    })
  } catch (error) {
    console.error('Ошибка при удалении связи отделений:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при удалении связи отделений' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
