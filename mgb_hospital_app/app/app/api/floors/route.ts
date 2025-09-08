
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic";

const prisma = new PrismaClient()

export async function GET() {
  try {
    const floors = await prisma.floor.findMany({
      include: {
        blocks: {
          include: {
            departments: {
              include: {
                rooms: {
                  include: {
                    equipment: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        floorNumber: 'asc'
      }
    })

    return NextResponse.json(floors)
  } catch (error) {
    console.error('Ошибка при получении данных этажей:', error)
    return NextResponse.json({ error: 'Не удалось получить данные этажей' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
