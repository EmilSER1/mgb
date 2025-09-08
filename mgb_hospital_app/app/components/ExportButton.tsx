
'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { exportFloorsToExcel, exportTurarToExcel, exportConnectionsToExcel } from '@/lib/excel-export'

interface Floor {
  name: string
  blocks?: {
    name: string
    code?: string
    departments?: {
      name: string
      rooms?: {
        name: string
        code?: string
        area?: number
        equipment?: {
          code: string
          name: string
          quantity: number
        }[]
      }[]
    }[]
  }[]
}

interface Department {
  name: string
  rooms?: {
    name: string
    equipment?: {
      code: string
      name: string
      quantity: number
    }[]
  }[]
}

interface ExportButtonProps {
  type: 'floors' | 'turar' | 'connections'
  data: any
  className?: string
  disabled?: boolean
}

export function ExportButton({ type, data, className, disabled }: ExportButtonProps) {
  const handleExport = () => {
    if (!data) {
      toast.error('Нет данных для экспорта')
      return
    }
    
    try {
      switch (type) {
        case 'floors':
          exportFloorsToExcel(data)
          toast.success('Данные Проектировщики экспортированы в Excel!')
          break
        case 'turar':
          exportTurarToExcel(data)
          toast.success('Данные Турар экспортированы в Excel!')
          break
        case 'connections':
          exportConnectionsToExcel(data.mappings, data.turarDepartments, data.projectDepartments)
          toast.success('Таблица соединений экспортирована в Excel!')
          break
        default:
          toast.error('Неизвестный тип экспорта')
      }
    } catch (error) {
      console.error('Ошибка при экспорте:', error)
      toast.error('Ошибка при экспорте данных')
    }
  }

  const getButtonText = () => {
    switch (type) {
      case 'floors':
        return 'Экспорт Проектировщики в Excel'
      case 'turar':
        return 'Экспорт Турар в Excel'
      case 'connections':
        return 'Экспорт соединений в Excel'
      default:
        return 'Экспорт в Excel'
    }
  }

  return (
    <Button 
      onClick={handleExport}
      className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
      disabled={disabled}
    >
      <Download className="w-4 h-4 mr-2" />
      {getButtonText()}
    </Button>
  )
}
