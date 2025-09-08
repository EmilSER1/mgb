
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Database, Users, MapPin, Package, ExternalLink, Edit, Save, X, ChevronRight, Building2, Eye, Download, Plus, Link as LinkIcon, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { exportConnectionsToExcel } from '@/lib/excel-export'

interface Equipment {
  id: string
  code: string
  name: string
  quantity: number
}

interface Room {
  id: string
  name: string
  code?: string
  area?: number
  equipment?: Equipment[]
}

interface Department {
  id: string
  name: string
  rooms?: Room[]
}

interface Mapping {
  id: string
  turarDepartmentName: string
  projectDepartmentName: string
}

interface RoomMapping {
  id: string
  turarRoomId: string
  projectRoomId: string
  turarRoom: Room
  projectRoom: Room
}

interface ConnectionsData {
  mappings: Mapping[]
  turarDepartments: Department[]
  projectDepartments: Department[]
  roomMappings?: RoomMapping[]
}

export default function ConnectionsPage() {
  const [data, setData] = useState<ConnectionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editRoomName, setEditRoomName] = useState('')
  const [expandedTurar, setExpandedTurar] = useState<Set<string>>(new Set())
  const [expandedProject, setExpandedProject] = useState<Set<string>>(new Set())
  
  // Новые состояния для создания связей
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [selectedTurarDept, setSelectedTurarDept] = useState<string>('')
  const [selectedProjectDept, setSelectedProjectDept] = useState<string>('')
  const [showRoomLinkDialog, setShowRoomLinkDialog] = useState(false)
  const [selectedTurarRoom, setSelectedTurarRoom] = useState<string>('')
  const [selectedProjectRoom, setSelectedProjectRoom] = useState<string>('')
  const [linkingFromTurar, setLinkingFromTurar] = useState<{deptId: string, roomId?: string} | null>(null)
  
  // Кэширование данных
  const [dataCache, setDataCache] = useState<ConnectionsData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    // Проверяем кэш
    const cachedData = localStorage.getItem('connections_data')
    const cacheTimestamp = localStorage.getItem('connections_timestamp')
    
    if (cachedData && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp)
      // Кэш действителен 5 минут
      if (cacheAge < 5 * 60 * 1000) {
        setData(JSON.parse(cachedData))
        setDataCache(JSON.parse(cachedData))
        setLastUpdated(new Date(parseInt(cacheTimestamp)))
        setLoading(false)
        return
      }
    }
    
    loadData()
    loadMappings()
    createTravmpunkt() // Создаем Травмпункт при загрузке
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/connections')
      const result = await response.json()
      
      if (result.success) {
        // Загружаем также связи кабинетов
        const roomMappingsResponse = await fetch('/api/connections/rooms')
        const roomMappingsResult = await roomMappingsResponse.json()
        
        const fullData = {
          ...result,
          roomMappings: roomMappingsResult.success ? roomMappingsResult.roomMappings : []
        }
        
        setData(fullData)
        setDataCache(fullData)
        setLastUpdated(new Date())
        
        // Сохраняем в localStorage
        localStorage.setItem('connections_data', JSON.stringify(fullData))
        localStorage.setItem('connections_timestamp', Date.now().toString())
      } else {
        toast.error('Ошибка при загрузке данных')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const loadMappings = async () => {
    try {
      await fetch('/api/connections/seed', { method: 'POST' })
    } catch (error) {
      console.error('Ошибка при загрузке сопоставлений:', error)
    }
  }

  const createTravmpunkt = async () => {
    try {
      const response = await fetch('/api/turar/create-travmpunkt', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        console.log('Травмпункт создан:', result.stats)
      }
    } catch (error) {
      console.error('Ошибка при создании Травмпункта:', error)
    }
  }

  const createDepartmentLink = async () => {
    if (!selectedTurarDept || !selectedProjectDept) {
      toast.error('Выберите отделения для связи')
      return
    }

    try {
      const response = await fetch('/api/connections/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turarDepartmentName: selectedTurarDept,
          projectDepartmentName: selectedProjectDept
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Связь отделений создана!')
        setShowLinkDialog(false)
        setSelectedTurarDept('')
        setSelectedProjectDept('')
        await loadData()
      } else {
        toast.error(result.error || 'Ошибка при создании связи')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Ошибка при создании связи')
    }
  }

  const createRoomLink = async () => {
    if (!selectedTurarRoom || !selectedProjectRoom) {
      toast.error('Выберите кабинеты для связи')
      return
    }

    try {
      const response = await fetch('/api/connections/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turarRoomId: selectedTurarRoom,
          projectRoomId: selectedProjectRoom
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Связь кабинетов создана!')
        setShowRoomLinkDialog(false)
        setSelectedTurarRoom('')
        setSelectedProjectRoom('')
        setLinkingFromTurar(null)
        await loadData()
      } else {
        toast.error(result.error || 'Ошибка при создании связи')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Ошибка при создании связи')
    }
  }

  const handleQuickRoomLink = (turarDeptId: string, turarRoomId: string) => {
    setLinkingFromTurar({ deptId: turarDeptId, roomId: turarRoomId })
    setSelectedTurarRoom(turarRoomId)
    setShowRoomLinkDialog(true)
  }

  const handleEditRoom = (roomId: string, currentName: string) => {
    setEditingRoomId(roomId)
    setEditRoomName(currentName)
  }

  const saveRoomName = async (roomId: string) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editRoomName,
        }),
      })

      if (response.ok) {
        setEditingRoomId(null)
        setEditRoomName('')
        await loadData() // Перезагружаем данные
        toast.success('Название кабинета обновлено!')
      } else {
        toast.error('Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Ошибка:', error)
      toast.error('Ошибка при сохранении')
    }
  }

  const cancelEdit = () => {
    setEditingRoomId(null)
    setEditRoomName('')
  }

  const toggleTurarExpansion = (deptId: string) => {
    const newExpanded = new Set(expandedTurar)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpandedTurar(newExpanded)
  }

  const toggleProjectExpansion = (deptId: string) => {
    const newExpanded = new Set(expandedProject)
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId)
    } else {
      newExpanded.add(deptId)
    }
    setExpandedProject(newExpanded)
  }

  const findMappedProjectDepartment = (turarDeptName: string) => {
    const mapping = data?.mappings.find(m => m.turarDepartmentName === turarDeptName)
    if (mapping) {
      return data?.projectDepartments.find(d => d.name === mapping.projectDepartmentName)
    }
    return null
  }

  const findMappedTurarDepartment = (projectDeptName: string) => {
    const mapping = data?.mappings.find(m => m.projectDepartmentName === projectDeptName)
    if (mapping) {
      return data?.turarDepartments.find(d => d.name === mapping.turarDepartmentName)
    }
    return null
  }

  // Группировка: одно отделение Турар к нескольким отделениям Проектировщики
  const getGroupedConnections = () => {
    if (!data) return []
    
    const grouped = new Map<string, {
      turarDept: Department
      projectDepts: Department[]
    }>()
    
    // Группируем по отделениям Турар
    data.turarDepartments.forEach(turarDept => {
      const relatedMappings = data.mappings.filter(m => m.turarDepartmentName === turarDept.name)
      const projectDepts = relatedMappings
        .map(mapping => data.projectDepartments.find(d => d.name === mapping.projectDepartmentName))
        .filter(Boolean) as Department[]
      
      if (projectDepts.length > 0) {
        grouped.set(turarDept.id, {
          turarDept,
          projectDepts
        })
      } else {
        // Отделения Турар без сопоставления
        grouped.set(turarDept.id, {
          turarDept,
          projectDepts: []
        })
      }
    })
    
    return Array.from(grouped.values())
  }

  const handleExportToExcel = () => {
    if (!data) {
      toast.error('Нет данных для экспорта')
      return
    }
    
    try {
      exportConnectionsToExcel(data.mappings, data.turarDepartments, data.projectDepartments)
      toast.success('Данные экспортированы в Excel!')
    } catch (error) {
      console.error('Ошибка при экспорте:', error)
      toast.error('Ошибка при экспорте данных')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Database className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p>Загрузка таблицы соединений...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <Database className="w-4 h-4" />
          Таблица соединения
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Интерактивная таблица соединений
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Сопоставление отделений между системами Турар и Проектировщики с возможностью редактирования
        </p>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <Button 
            onClick={handleExportToExcel}
            className="bg-amber-600 hover:bg-amber-700 text-white"
            disabled={!data || loading}
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт в Excel
          </Button>
          
          <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                <Plus className="w-4 h-4 mr-2" />
                Создать связь отделений
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать связь отделений</DialogTitle>
                <DialogDescription>
                  Выберите отделения из Турар и Проектировщики для создания связи
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Отделение Турар:
                  </label>
                  <Select value={selectedTurarDept} onValueChange={setSelectedTurarDept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите отделение Турар" />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.turarDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Отделение Проектировщики:
                  </label>
                  <Select value={selectedProjectDept} onValueChange={setSelectedProjectDept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите отделение Проектировщики" />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.projectDepartments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                    Отмена
                  </Button>
                  <Button onClick={createDepartmentLink} className="bg-green-600 hover:bg-green-700">
                    Создать связь
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showRoomLinkDialog} onOpenChange={setShowRoomLinkDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
                <LinkIcon className="w-4 h-4 mr-2" />
                Связать кабинеты
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Создать связь кабинетов</DialogTitle>
                <DialogDescription>
                  Выберите кабинеты из Турар и Проектировщики для создания прямой связи
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Кабинет Турар:
                  </label>
                  <Select value={selectedTurarRoom} onValueChange={setSelectedTurarRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите кабинет Турар" />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.turarDepartments.flatMap(dept => 
                        dept.rooms?.map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {dept.name} → {room.name}
                          </SelectItem>
                        )) || []
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Кабинет Проектировщики:
                  </label>
                  <Select value={selectedProjectRoom} onValueChange={setSelectedProjectRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите кабинет Проектировщики" />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.projectDepartments.flatMap(dept => 
                        dept.rooms?.map(room => (
                          <SelectItem key={room.id} value={room.id}>
                            {dept.name} → {room.name}
                          </SelectItem>
                        )) || []
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => {
                    setShowRoomLinkDialog(false)
                    setLinkingFromTurar(null)
                  }}>
                    Отмена
                  </Button>
                  <Button onClick={createRoomLink} className="bg-blue-600 hover:bg-blue-700">
                    Создать связь
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {lastUpdated && (
            <div className="text-xs text-gray-500 self-center">
              Обновлено: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <CardContent className="p-6">
            <Database className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{data?.mappings.length || 0}</div>
            <div className="text-sm text-gray-600">Сопоставлений</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{data?.turarDepartments.length || 0}</div>
            <div className="text-sm text-gray-600">Турар отделений</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-6">
            <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">{data?.projectDepartments.length || 0}</div>
            <div className="text-sm text-gray-600">Проектировщики отделений</div>
          </CardContent>
        </Card>
      </div>

      {/* Основная таблица соединений с группировкой */}
      <div className="space-y-4">
        {getGroupedConnections().map((connection) => {
          const { turarDept, projectDepts } = connection
          const isExpanded = expandedTurar.has(turarDept.id)

          return (
            <Card key={turarDept.id} className="border-0 shadow-lg bg-white/90 backdrop-blur overflow-hidden relative">
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-x divide-gray-200">
                  {/* Левая половина - Турар */}
                  <div className="p-6 bg-green-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-green-800">Турар</h3>
                          <p className="text-sm text-green-600">{turarDept.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {turarDept.rooms?.length || 0} каб.
                        </Badge>
                        <Link href="/turar" className="text-green-600 hover:text-green-800">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTurarExpansion(turarDept.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Кабинеты:</div>
                        <div className="space-y-1 overflow-y-auto">
                          {turarDept.rooms?.map((room) => (
                            <div key={room.id} className="flex items-center justify-between bg-white/60 rounded-lg p-3 text-sm">
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">{room.name}</div>
                                <div className="text-xs text-gray-500">
                                  {room.equipment?.length || 0} единиц оборудования
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleQuickRoomLink(turarDept.id, room.id)}
                                  className="text-amber-600 hover:text-amber-800 h-6 w-6 p-0"
                                  title="Связать с кабинетом Проектировщики"
                                >
                                  <LinkIcon className="w-3 h-3" />
                                </Button>
                                <Link 
                                  href={`/turar/${turarDept.id}/rooms/${room.id}`}
                                  className="text-green-600 hover:text-green-800"
                                  title="Перейти к кабинету"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Правая половина - Проектировщики (ГРУППИРОВКА) */}
                  <div className="p-6 bg-blue-50/50">
                    {projectDepts.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-blue-800">Проектировщики</h3>
                              <p className="text-sm text-blue-600">
                                {projectDepts.length === 1 
                                  ? projectDepts[0].name 
                                  : `${projectDepts.length} связанных отделений`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {projectDepts.reduce((acc, dept) => acc + (dept.rooms?.length || 0), 0)} каб.
                            </Badge>
                            <Link href="/floors" className="text-blue-600 hover:text-blue-800">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>

                        {/* Список всех связанных отделений Проектировщики */}
                        <div className="space-y-3">
                          {projectDepts.map((projectDept) => {
                            const isProjectExpanded = expandedProject.has(projectDept.id)
                            
                            return (
                              <div key={projectDept.id} className="bg-white/60 rounded-lg p-3 border">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-blue-800 text-sm">{projectDept.name}</div>
                                    <div className="text-xs text-blue-600">
                                      {projectDept.rooms?.length || 0} кабинетов
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleProjectExpansion(projectDept.id)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </div>

                                {isProjectExpanded && (
                                  <div className="space-y-1 mt-2">
                                    <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Кабинеты:</div>
                                    <div className="space-y-1 overflow-y-auto">
                                      {projectDept.rooms?.map((room) => (
                                        <div key={room.id} className="bg-white/80 rounded p-2 text-xs">
                                          {editingRoomId === room.id ? (
                                            <div className="flex items-center gap-1">
                                              <Input
                                                value={editRoomName}
                                                onChange={(e) => setEditRoomName(e.target.value)}
                                                className="flex-1 text-xs h-6"
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') saveRoomName(room.id)
                                                  if (e.key === 'Escape') cancelEdit()
                                                }}
                                              />
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => saveRoomName(room.id)}
                                                className="text-green-600 hover:text-green-800 h-6 w-6 p-0"
                                              >
                                                <Save className="w-2 h-2" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={cancelEdit}
                                                className="text-gray-600 hover:text-gray-800 h-6 w-6 p-0"
                                              >
                                                <X className="w-2 h-2" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center justify-between">
                                              <div className="flex-1">
                                                <div className="font-medium text-gray-800">{room.name}</div>
                                                <div className="text-gray-500">
                                                  {room.equipment?.length || 0} ед. оборуд.
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => handleEditRoom(room.id, room.name)}
                                                  className="text-blue-600 hover:text-blue-800 h-6 w-6 p-0"
                                                >
                                                  <Edit className="w-2 h-2" />
                                                </Button>
                                                <Link 
                                                  href={`/floors`}
                                                  className="text-blue-600 hover:text-blue-800 h-6 w-6 p-0 inline-flex items-center justify-center"
                                                >
                                                  <ExternalLink className="w-2 h-2" />
                                                </Link>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 space-y-3">
                        <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Нет сопоставленных отделений</p>
                        <p className="text-xs text-gray-400">в системе Проектировщики</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTurarDept(turarDept.name)
                            setShowLinkDialog(true)
                          }}
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Создать связь
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Соединительная линия в центре с количеством связей */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="bg-amber-500 rounded-full flex items-center justify-center shadow-lg min-w-8 h-8 px-2">
                    {projectDepts.length > 1 ? (
                      <span className="text-white text-xs font-bold">{projectDepts.length}</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Отделения Проектировщики без сопоставления */}
        {data?.projectDepartments.filter(dept => !findMappedTurarDepartment(dept.name)).map((projectDept) => (
          <Card key={`unmapped-${projectDept.id}`} className="border-0 shadow-lg bg-white/90 backdrop-blur overflow-hidden relative">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 divide-x divide-gray-200">
                {/* Левая половина - пустая */}
                <div className="p-6 bg-gray-50/50">
                  <div className="text-center py-8 text-gray-500 space-y-3">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Нет сопоставленного отделения</p>
                    <p className="text-xs text-gray-400">в системе Турар</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedProjectDept(projectDept.name)
                        setShowLinkDialog(true)
                      }}
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Создать связь
                    </Button>
                  </div>
                </div>

                {/* Правая половина - Проектировщики */}
                <div className="p-6 bg-blue-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-800">Проектировщики</h3>
                        <p className="text-sm text-blue-600">{projectDept.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {projectDept.rooms?.length || 0} каб.
                      </Badge>
                      <Link href="/floors" className="text-blue-600 hover:text-blue-800">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!data?.turarDepartments || data?.turarDepartments.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет данных для соединения</h3>
              <p className="text-gray-600">Загрузите данные отделений для создания таблицы соединений</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
