
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - получить все связи кабинетов
export async function GET() {
  try {
    const roomMappings = await prisma.roomMapping.findMany({
      include: {
        turarRoom: {
          include: {
            department: true,
            equipment: true
          }
        },
        projectRoom: {
          include: {
            department: {
              include: {
                block: {
                  include: {
                    floor: true
                  }
                }
              }
            },
            equipment: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      roomMappings
    })
  } catch (error) {
    console.error('Ошибка при получении связей кабинетов:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при получении связей кабинетов' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - создать связь кабинетов
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { turarRoomId, projectRoomId } = body

    if (!turarRoomId || !projectRoomId) {
      return NextResponse.json(
        { success: false, error: 'Не указаны ID кабинетов' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли уже такая связь
    const existingMapping = await prisma.roomMapping.findUnique({
      where: {
        turarRoomId_projectRoomId: {
          turarRoomId,
          projectRoomId
        }
      }
    })

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Связь уже существует' },
        { status: 400 }
      )
    }

    const roomMapping = await prisma.roomMapping.create({
      data: {
        turarRoomId,
        projectRoomId
      },
      include: {
        turarRoom: {
          include: {
            department: true
          }
        },
        projectRoom: {
          include: {
            department: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      roomMapping
    })
  } catch (error) {
    console.error('Ошибка при создании связи кабинетов:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при создании связи кабинетов' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - удалить связь кабинетов
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

    await prisma.roomMapping.delete({
      where: {
        id: mappingId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Связь удалена'
    })
  } catch (error) {
    console.error('Ошибка при удалении связи кабинетов:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка при удалении связи кабинетов' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
