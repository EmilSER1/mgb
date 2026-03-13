'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, Medal, RefreshCcw, Trophy, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MeetingStat {
  employeeId: string
  employeeName: string
  position: string
  meetingsCount: number
}

interface MeetingsResponse {
  generatedAt: string
  stats: MeetingStat[]
  error?: string
}

const POLL_INTERVAL_MS = 30000

export default function MeetingsRatingPage() {
  const [stats, setStats] = useState<MeetingStat[]>([])
  const [generatedAt, setGeneratedAt] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [popupMessage, setPopupMessage] = useState<string | null>(null)

  const prevCountsRef = useRef<Map<string, number>>(new Map())

  const loadStats = async (showLoader = false) => {
    if (showLoader) setLoading(true)

    try {
      const response = await fetch('/api/bitrix/meetings-today', { cache: 'no-store' })
      const payload = (await response.json()) as MeetingsResponse

      if (!response.ok || payload.error) {
        throw new Error(payload.error || 'Ошибка загрузки данных из Bitrix')
      }

      const nextCounts = new Map(payload.stats.map((item) => [item.employeeId, item.meetingsCount]))

      payload.stats.forEach((item) => {
        const previous = prevCountsRef.current.get(item.employeeId) || 0

        if (item.meetingsCount > previous) {
          setPopupMessage(`Вау, красавчик! ${item.employeeName} назначил(а) новую встречу 👏`)
        }
      })

      prevCountsRef.current = nextCounts
      setStats(payload.stats)
      setGeneratedAt(payload.generatedAt)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось получить данные'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats(true)

    const timer = setInterval(() => {
      loadStats(false)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!popupMessage) return

    const timeout = setTimeout(() => setPopupMessage(null), 4500)
    return () => clearTimeout(timeout)
  }, [popupMessage])

  const totalMeetings = useMemo(
    () => stats.reduce((sum, employee) => sum + employee.meetingsCount, 0),
    [stats]
  )

  const leader = stats[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Рейтинг встреч за сегодня</h1>
          <p className="text-gray-600">Отслеживание операторов, которые перевели сделки в этап «Назначена встреча».</p>
        </div>

        <Button onClick={() => loadStats(true)} variant="outline" className="w-fit">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Обновить
        </Button>
      </div>

      {popupMessage && (
        <div className="fixed right-6 top-20 z-50 w-[340px] rounded-xl border border-green-200 bg-white p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <Bell className="h-4 w-4 text-green-700" />
            </div>
            <div className="text-sm font-medium text-gray-800">{popupMessage}</div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Всего назначено встреч</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-blue-700">{totalMeetings}</CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Активных сотрудников</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-3xl font-bold text-indigo-700">
            <Users className="h-6 w-6" />
            {stats.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Лидер дня</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-lg font-semibold text-amber-600">
            <Trophy className="h-5 w-5" />
            {leader ? `${leader.employeeName} (${leader.meetingsCount})` : 'Пока нет данных'}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Таблица рейтинга</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-gray-500">Загрузка...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : stats.length === 0 ? (
            <p className="text-gray-500">Сегодня пока не назначено ни одной встречи.</p>
          ) : (
            <div className="space-y-3">
              {stats.map((employee, index) => (
                <div
                  key={employee.employeeId}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{employee.employeeName}</div>
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                    <Medal className="h-4 w-4" />
                    {employee.meetingsCount}
                  </div>
                </div>
              ))}
            </div>
          )}

          {generatedAt && !error && (
            <p className="mt-4 text-xs text-gray-500">Обновлено: {new Date(generatedAt).toLocaleTimeString('ru-RU')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
