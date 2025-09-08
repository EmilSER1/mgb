
import { PrismaClient } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin, Package, Users, Download } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/ExportButton'
import Link from 'next/link'

const prisma = new PrismaClient()

async function getFloors() {
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
              },
              orderBy: {
                name: 'asc'
              }
            }
          }
        }
      },
      orderBy: {
        floorNumber: 'asc'
      }
    })

    // Группируем блоки по этажам и объединяем одинаковые
    const processedFloors = floors.map(floor => {
      const groupedBlocks = new Map()
      
      floor.blocks?.forEach(block => {
        const blockKey = block.code || block.name || 'Без названия'
        
        if (groupedBlocks.has(blockKey)) {
          // Объединяем отделения одинаковых блоков
          const existingBlock = groupedBlocks.get(blockKey)
          existingBlock.departments = [
            ...(existingBlock.departments || []),
            ...(block.departments || [])
          ]
          // Обновляем статистику
          existingBlock.totalRooms = (existingBlock.totalRooms || 0) + (block.departments?.reduce((acc: number, dept: any) => acc + (dept.rooms?.length || 0), 0) || 0)
          existingBlock.totalEquipment = (existingBlock.totalEquipment || 0) + (block.departments?.reduce((acc: number, dept: any) => acc + (dept.rooms?.reduce((roomAcc: number, room: any) => roomAcc + (room.equipment?.length || 0), 0) || 0), 0) || 0)
        } else {
          const processedBlock = {
            ...block,
            totalRooms: block.departments?.reduce((acc: number, dept: any) => acc + (dept.rooms?.length || 0), 0) || 0,
            totalEquipment: block.departments?.reduce((acc: number, dept: any) => acc + (dept.rooms?.reduce((roomAcc: number, room: any) => roomAcc + (room.equipment?.length || 0), 0) || 0), 0) || 0
          }
          groupedBlocks.set(blockKey, processedBlock)
        }
      })
      
      // Сортируем объединенные блоки по алфавиту
      const sortedBlocks = Array.from(groupedBlocks.values()).sort((a, b) => {
        const aKey = (a.code || a.name || '').toLowerCase()
        const bKey = (b.code || b.name || '').toLowerCase()
        return aKey.localeCompare(bKey, 'ru', { numeric: true })
      })
      
      return {
        ...floor,
        blocks: sortedBlocks
      }
    })
    
    return processedFloors
  } catch (error) {
    console.error('Ошибка при получении данных этажей:', error)
    return []
  } finally {
    await prisma.$disconnect()
  }
}

export default async function FloorsPage() {
  const floors = await getFloors()

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <Building2 className="w-4 h-4" />
          Проектировщики
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Управление этажами и блоками
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Иерархическая навигация по этажам → блокам → кабинетам с полным функционалом редактирования
        </p>
        <div className="mt-4">
          <ExportButton type="floors" data={floors} />
        </div>
      </div>

      {/* Этажи как аккордеон */}
      <div className="max-w-full">
        <Accordion type="multiple" className="space-y-4">
          {floors?.map((floor) => (
            <AccordionItem
              key={floor?.id}
              value={`floor-${floor?.id}`}
              className="border-0 shadow-lg bg-white/90 backdrop-blur rounded-xl overflow-hidden"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-blue-50/50 transition-colors [&[data-state=open]]:bg-blue-50">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {floor?.name || 'Без названия'}
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {floor?.blocks?.length || 0} блоков
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {floor?.blocks?.reduce((acc, block) => acc + (block?.departments?.length || 0), 0) || 0} отделений
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {floor?.blocks?.reduce((acc, block) => 
                            acc + (block?.departments?.reduce((deptAcc, dept) => 
                              deptAcc + (dept?.rooms?.length || 0), 0) || 0), 0) || 0} помещений
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {floor?.blocks?.reduce((acc, block) => 
                            acc + (block?.departments?.reduce((deptAcc, dept) => 
                              deptAcc + (dept?.rooms?.reduce((roomAcc, room) => 
                                roomAcc + (room?.equipment?.length || 0), 0) || 0), 0) || 0), 0) || 0} ед. оборуд.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-6">
                {/* Блоки внутри этажа */}
                <div className="flex flex-col gap-4">
                  {floor?.blocks?.map((block) => (
                    <Card key={block?.id} className="transition-all duration-300 hover:shadow-md border border-gray-200 bg-gray-50/50 hover:bg-white">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <Link 
                            href={`/floors/${floor?.id}/blocks/${block?.id}`}
                            className="group flex items-center gap-3 hover:text-blue-600 transition-colors flex-1"
                          >
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              {block?.code || '?'}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{block?.name || 'Блок без названия'}</CardTitle>
                              <CardDescription>
                                {block?.departments?.length || 0} отделений • {' '}
                                {block?.departments?.reduce((acc, dept) => acc + (dept?.rooms?.length || 0), 0) || 0} помещений
                              </CardDescription>
                            </div>
                          </Link>
                          <Badge className="bg-blue-600 text-white">
                            {block?.departments?.reduce((acc, dept) => 
                              acc + (dept?.rooms?.reduce((roomAcc, room) => 
                                roomAcc + (room?.equipment?.length || 0), 0) || 0), 0) || 0} ед. оборуд.
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {/* Все отделения без ограничений */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-2">
                            <Users className="w-3 h-3" />
                            Все отделения в блоке:
                          </div>
                          <div className="space-y-2">
                            {block?.departments?.map((dept) => (
                              <div key={dept?.id} className="text-sm bg-white border rounded-lg p-3 shadow-sm">
                                <div className="font-medium text-gray-800 mb-2 flex items-center justify-between">
                                  <span>{dept?.name || 'Отделение без названия'}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {dept?.rooms?.length || 0} каб.
                                  </Badge>
                                </div>
                                <div className="text-gray-600 text-xs">
                                  <div className="font-medium mb-1">Кабинеты:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {dept?.rooms?.map((room, roomIndex) => (
                                      <span key={room?.id} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                        {room?.name || `Кабинет ${roomIndex + 1}`}
                                      </span>
                                    ))}
                                  </div>
                                  {(!dept?.rooms || dept?.rooms?.length === 0) && (
                                    <span className="text-gray-400 italic">Нет кабинетов</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {(!block?.departments || block?.departments?.length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p>Нет отделений в данном блоке</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Кнопка перехода */}
                        <Link 
                          href={`/floors/${floor?.id}/blocks/${block?.id}`}
                          className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-sm py-2 rounded-md transition-colors font-medium mt-4"
                        >
                          Перейти к управлению блоком →
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {(!floor?.blocks || floor?.blocks?.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Нет блоков на данном этаже</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {(!floors || floors?.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет этажей</h3>
              <p className="text-gray-600">Этажи не найдены в системе</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
