
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const dynamic = "force-dynamic";

const prisma = new PrismaClient()

export async function GET() {
  try {
    const departments = await prisma.turarDepartment.findMany({
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

    return NextResponse.json(departments)
  } catch (error) {
    console.error('Ошибка при получении данных Турар:', error)
    return NextResponse.json({ error: 'Не удалось получить данные Турар' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
