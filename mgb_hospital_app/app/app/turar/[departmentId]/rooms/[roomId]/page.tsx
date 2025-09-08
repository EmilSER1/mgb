
import { PrismaClient } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, MapPin, Package, ArrowLeft, Building } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const prisma = new PrismaClient()

interface PageProps {
  params: {
    departmentId: string
    roomId: string
  }
}

async function getRoomData(roomId: string) {
  try {
    const room = await prisma.turarRoom.findUnique({
      where: { id: roomId },
      include: {
        department: true,
        equipment: {
          orderBy: {
            name: 'asc'
          }
        }
      }
    })
    return room
  } catch (error) {
    console.error('Ошибка при получении данных кабинета:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

export default async function TurarRoomPage({ params }: PageProps) {
  const room = await getRoomData(params.roomId)
  
  if (!room) {
    notFound()
  }

  const totalEquipment = room?.equipment?.reduce((acc, eq) => acc + (eq?.quantity || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/turar" className="hover:text-green-600 transition-colors">
          Турар
        </Link>
        <span>/</span>
        <Link href="/turar" className="hover:text-green-600 transition-colors">
          {room?.department?.name || 'Отделение'}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{room?.name || 'Кабинет'}</span>
      </div>

      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/turar" 
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{room?.name || 'Кабинет без названия'}</h1>
              <p className="text-lg text-gray-600">
                {room?.department?.name || 'Отделение'} • Турар
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900">{room?.equipment?.length || 0}</div>
                  <div className="text-sm text-green-700">Типов оборудования</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">{totalEquipment}</div>
                  <div className="text-sm text-blue-700">Общее количество единиц</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Equipment List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Оборудование</h2>
        {(room?.equipment?.length || 0) > 0 ? (
          <div className="grid gap-4">
            {room?.equipment?.map((equipment, index) => (
              <Card key={equipment?.id || index} className="border-0 shadow-md bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate" title={equipment?.name || 'Без названия'}>
                            {equipment?.name || 'Оборудование без названия'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                              Код: {equipment?.code || 'Нет кода'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {equipment?.quantity || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        штук
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Оборудование не найдено</h3>
              <p className="text-gray-600">
                В этом кабинете пока нет зарегистрированного оборудования
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
