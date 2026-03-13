import { NextResponse } from 'next/server'
import { getTodayMeetingStats } from '@/lib/bitrix'

export async function GET() {
  try {
    const stats = await getTodayMeetingStats()

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      stats,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    )
  }
}
