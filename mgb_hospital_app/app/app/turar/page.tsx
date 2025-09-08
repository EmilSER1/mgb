
import { PrismaClient } from '@prisma/client'
import { Users, MapPin, Package, Building, ChevronDown } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { EditDepartmentDialog } from '@/components/EditDepartmentDialog'
import { EditRoomDialog } from '@/components/EditRoomDialog'
import { ExportButton } from '@/components/ExportButton'

const prisma = new PrismaClient()

async function getTurarDepartments() {
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
    return departments
  } catch (error) {
    console.error('Ошибка при получении данных Турар:', error)
    return []
  } finally {
    await prisma.$disconnect()
  }
}

export default async function TurarPage() {
  const departments = await getTurarDepartments()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <Users className="w-4 h-4" />
          Турар
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Управление отделениями Турар
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Компактная организация по отделениям и кабинетам с кодами оборудования
        </p>
        <div className="mt-4">
          <ExportButton type="turar" data={departments} />
        </div>
      </div>

      {/* Аккордеон отделений */}
      <div className="max-w-6xl mx-auto">
        <Accordion type="multiple" className="space-y-4">
          {departments?.map((department) => (
            <AccordionItem
              key={department?.id}
              value={`department-${department?.id}`}
              className="border-0 shadow-lg bg-white/90 backdrop-blur rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-green-50/50 transition-colors [&[data-state=open]]:bg-green-50">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-green-600" />
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
                  <EditDepartmentDialog department={department} type="turar" />
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6">
                {/* Аккордеон помещений внутри отделения */}
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
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="text-left">
                              <h4 className="font-medium text-gray-900">
                                {room?.name || 'Кабинет без названия'}
                              </h4>
                              <div className="text-sm text-gray-600">
                                {room?.equipment?.length || 0} типов оборудования
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {room?.equipment?.reduce((acc, eq) => acc + (eq?.quantity || 0), 0) || 0} шт.
                            </Badge>
                            <EditRoomDialog room={room} type="turar" />
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
                                      <Badge className="bg-green-600 text-white">
                                        {equipment?.quantity || 0} шт.
                                      </Badge>
                                    </div>
                                    <h5 className="font-medium text-gray-900 leading-tight">
                                      {equipment?.name || 'Оборудование без названия'}
                                    </h5>
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

        {(!departments || departments?.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет отделений</h3>
              <p className="text-gray-600">Отделения Турар не найдены</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
