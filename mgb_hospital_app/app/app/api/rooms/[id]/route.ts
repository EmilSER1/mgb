
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const room = await prisma.room.update({
      where: { id: params.id },
      data: {
        name: data.name,
        code: data.code,
        area: data.area,
        description: data.description
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error('Ошибка при обновлении кабинета:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении кабинета' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
