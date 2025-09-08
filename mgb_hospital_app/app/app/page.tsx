
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Database, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <Building2 className="w-4 h-4" />
          Проектировщики
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          МГБ
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Система управления больницей с раскладкой по этажам и кабинетам
        </p>
      </div>

      {/* Main Sections */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/floors" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 border-0 shadow-md bg-white/70 backdrop-blur">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Проектировщики</CardTitle>
                <CardDescription className="text-gray-600">
                  Иерархическая навигация по этажам, блокам и кабинетам с полным функционалом редактирования
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                Управление этажами и оборудованием →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/turar" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 border-0 shadow-md bg-white/70 backdrop-blur">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Турар</CardTitle>
                <CardDescription className="text-gray-600">
                  Организация по отделениям и кабинетам с кодами оборудования и количеством
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-green-600 font-medium group-hover:text-green-700 transition-colors">
                Управление отделениями Турар →
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/connections" className="group">
          <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 border-0 shadow-md bg-white/70 backdrop-blur">
            <CardHeader className="space-y-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Database className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-900">Таблица соединения</CardTitle>
                <CardDescription className="text-gray-600">
                  Интерактивная таблица сопоставления отделений с экспортом в Excel
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-amber-600 font-medium">
                <AlertCircle className="w-4 h-4" />
                Будущая функциональность
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
