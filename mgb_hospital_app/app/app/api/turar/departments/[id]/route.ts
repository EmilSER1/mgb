
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const department = await prisma.turarDepartment.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description
      }
    })

    return NextResponse.json(department)
  } catch (error) {
    console.error('Ошибка при обновлении отделения Турар:', error)
    return NextResponse.json({ error: 'Ошибка при обновлении отделения Турар' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
