
import { PrismaClient } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Package, ArrowLeft, Users } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog'
import { EditRoomDialog } from '@/components/EditRoomDialog'

const prisma = new PrismaClient()

interface PageProps {
  params: {
    floorId: string
    blockId: string
  }
}

async function getBlockData(blockId: string) {
  try {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: {
        floor: true,
        departments: {
          include: {
            rooms: {
              include: {
                equipment: {
                  orderBy: {
                    name: 'asc'
                  }
                }
              }
            }
          }
        }
      }
    })
    return block
  } catch (error) {
    console.error('Ошибка при получении данных блока:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

export default async function BlockPage({ params }: PageProps) {
  const block = await getBlockData(params.blockId)
  
  if (!block) {
    notFound()
  }

  const totalRooms = block?.departments?.reduce((acc, dept) => acc + (dept?.rooms?.length || 0), 0) || 0
  const totalEquipment = block?.departments?.reduce((acc, dept) => 
    acc + (dept?.rooms?.reduce((roomAcc, room) => 
      roomAcc + (room?.equipment?.reduce((eqAcc, eq) => eqAcc + (eq?.quantity || 0), 0) || 0), 0) || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/floors" className="hover:text-blue-600 transition-colors">
          Этажи
        </Link>
        <span>/</span>
        <Link href="/floors" className="hover:text-blue-600 transition-colors">
          {block?.floor?.name || 'Этаж'}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{block?.name || 'Блок'}</span>
      </div>

      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/floors" 
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{block?.name || 'Блок без названия'}</h1>
              <p className="text-lg text-gray-600">
                {block?.floor?.name || 'Этаж'} • Код: {block?.code || 'Нет кода'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-900">{block?.departments?.length || 0}</div>
                  <div className="text-sm text-blue-700">Отделений</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-900">{totalRooms}</div>
                  <div className="text-sm text-green-700">Помещений</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-900">{totalEquipment}</div>
                  <div className="text-sm text-purple-700">Единиц оборудования</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Departments Accordion */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Отделения</h2>
        
        <div className="max-w-full">
          <Accordion type="multiple" className="space-y-4">
            {block?.departments?.map((department) => (
              <AccordionItem
                key={department?.id}
                value={`department-${department?.id}`}
                className="border-0 shadow-lg bg-white/90 backdrop-blur rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:bg-blue-50/50 transition-colors [&[data-state=open]]:bg-blue-50">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {department?.name || 'Отделение без названия'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {department?.rooms?.length || 0} помещений
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            {department?.rooms?.reduce((acc, room) => 
                              acc + (room?.equipment?.reduce((eqAcc, eq) => eqAcc + (eq?.quantity || 0), 0) || 0), 0) || 0} ед. оборудования
                          </div>
                        </div>
                      </div>
                    </div>
                    <EditDepartmentDialog department={department} type="regular" />
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6">
                  {/* Rooms Accordion within Department */}
                  <Accordion type="multiple" className="space-y-3">
                    {department?.rooms?.map((room) => (
                      <AccordionItem
                        key={room?.id}
                        value={`room-${room?.id}`}
                        className="border border-gray-200 rounded-lg bg-gray-50/50"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:bg-white/50 transition-colors [&[data-state=open]]:bg-white/80">
                          <div className="flex items-center justify-between w-full mr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <h4 className="font-medium text-gray-900">
                                  {room?.name || 'Кабинет без названия'}
                                </h4>
                                <div className="text-sm text-gray-600">
                                  Код: {room?.code || 'Нет кода'} {room?.area && `• ${room.area} м²`}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                {room?.equipment?.length || 0} типов оборуд.
                              </Badge>
                              <Badge className="bg-blue-600 text-white">
                                {room?.equipment?.reduce((acc, eq) => acc + (eq?.quantity || 0), 0) || 0} шт.
                              </Badge>
                              <EditRoomDialog room={room} type="regular" />
                            </div>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-3 mt-3">
                            {room?.equipment?.map((equipment, equipmentIndex) => (
                              <Card key={`${equipment?.id || equipmentIndex}`} className="border border-gray-200 bg-white">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {equipment?.code || 'Нет кода'}
                                        </Badge>
                                        <Badge className="bg-blue-600 text-white">
                                          {equipment?.quantity || 0} {equipment?.unit || 'шт.'}
                                        </Badge>
                                      </div>
                                      <h5 className="font-medium text-gray-900 leading-tight">
                                        {equipment?.name || 'Оборудование без названия'}
                                      </h5>
                                      {equipment?.notes && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {equipment.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                            
                            {(!room?.equipment || room?.equipment?.length === 0) && (
                              <div className="text-center py-8 text-gray-500">
                                <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>Нет оборудования в данном помещении</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {(!department?.rooms || department?.rooms?.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>Нет помещений в данном отделении</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {(!block?.departments || block?.departments?.length === 0) && (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет отделений</h3>
                <p className="text-gray-600">Отделения в данном блоке не найдены</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
