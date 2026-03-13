export interface BitrixDeal {
  ID: string
  ASSIGNED_BY_ID?: string
  STAGE_ID?: string
}

export interface BitrixUser {
  ID: string
  NAME?: string
  LAST_NAME?: string
  SECOND_NAME?: string
  WORK_POSITION?: string
}

export interface MeetingStat {
  employeeId: string
  employeeName: string
  position: string
  meetingsCount: number
}

interface BitrixListResponse<T> {
  result?: T[]
  error?: string
  error_description?: string
}

const DEFAULT_STAGE = 'APPOINTED'

function buildBitrixEndpoint(path: string): string {
  const webhook = process.env.BITRIX_WEBHOOK_URL

  if (!webhook) {
    throw new Error('BITRIX_WEBHOOK_URL не задан. Добавьте его в .env.local')
  }

  return `${webhook.replace(/\/$/, '')}/${path}`
}

async function bitrixPost<T>(path: string, body: Record<string, unknown>): Promise<T[]> {
  const endpoint = buildBitrixEndpoint(path)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Bitrix API вернул статус ${response.status}`)
  }

  const payload = (await response.json()) as BitrixListResponse<T>

  if (payload.error) {
    throw new Error(payload.error_description || payload.error)
  }

  return payload.result || []
}

function formatDateBoundary(date: Date, isEnd = false): string {
  const boundary = new Date(date)

  if (isEnd) {
    boundary.setHours(23, 59, 59, 999)
  } else {
    boundary.setHours(0, 0, 0, 0)
  }

  return boundary.toISOString()
}

function buildEmployeeName(user: BitrixUser): string {
  const fullName = [user.LAST_NAME, user.NAME, user.SECOND_NAME].filter(Boolean).join(' ').trim()
  return fullName || `Сотрудник #${user.ID}`
}

export async function getTodayMeetingStats(): Promise<MeetingStat[]> {
  const stage = process.env.BITRIX_MEETING_STAGE_ID || DEFAULT_STAGE
  const today = new Date()

  const deals = await bitrixPost<BitrixDeal>('crm.deal.list', {
    filter: {
      STAGE_ID: stage,
      '>=DATE_MODIFY': formatDateBoundary(today),
      '<=DATE_MODIFY': formatDateBoundary(today, true),
    },
    select: ['ID', 'ASSIGNED_BY_ID', 'STAGE_ID'],
  })

  const counts = new Map<string, number>()

  for (const deal of deals) {
    if (!deal.ASSIGNED_BY_ID) continue
    counts.set(deal.ASSIGNED_BY_ID, (counts.get(deal.ASSIGNED_BY_ID) || 0) + 1)
  }

  const employeeIds = Array.from(counts.keys())

  if (employeeIds.length === 0) {
    return []
  }

  const users = await bitrixPost<BitrixUser>('user.get', {
    FILTER: {
      ID: employeeIds,
    },
  })

  const usersById = new Map(users.map((user) => [user.ID, user]))

  return employeeIds
    .map((employeeId) => {
      const user = usersById.get(employeeId)

      return {
        employeeId,
        employeeName: user ? buildEmployeeName(user) : `Сотрудник #${employeeId}`,
        position: user?.WORK_POSITION || 'Оператор',
        meetingsCount: counts.get(employeeId) || 0,
      }
    })
    .sort((a, b) => b.meetingsCount - a.meetingsCount)
}
