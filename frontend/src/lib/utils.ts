import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isTomorrow, isYesterday, formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

// Tailwind CSS classes を結合するユーティリティ
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 日付フォーマット用ユーティリティ
export function formatDate(date: Date | string, formatStr = 'yyyy/MM/dd') {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr, { locale: ja })
}

export function formatTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'HH:mm', { locale: ja })
}

export function formatDateTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'yyyy/MM/dd HH:mm', { locale: ja })
}

export function formatRelativeTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isToday(dateObj)) {
    return `今日 ${formatTime(dateObj)}`
  }
  if (isTomorrow(dateObj)) {
    return `明日 ${formatTime(dateObj)}`
  }
  if (isYesterday(dateObj)) {
    return `昨日 ${formatTime(dateObj)}`
  }
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: ja 
  })
}

// 服薬ステータス関連ユーティリティ
export type MedicationStatus = 'pending' | 'completed' | 'missed' | 'skipped'

export function getMedicationStatusColor(status: MedicationStatus) {
  switch (status) {
    case 'completed':
      return 'success'
    case 'pending':
      return 'pending'
    case 'missed':
      return 'destructive'
    case 'skipped':
      return 'warning'
    default:
      return 'secondary'
  }
}

export function getMedicationStatusText(status: MedicationStatus) {
  switch (status) {
    case 'completed':
      return '服薬済み'
    case 'pending':
      return '予定'
    case 'missed':
      return '飲み忘れ'
    case 'skipped':
      return 'スキップ'
    default:
      return '不明'
  }
}

// 遵守率計算
export function calculateAdherenceRate(total: number, completed: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// バリデーション用ユーティリティ
export function isValidTime(timeString: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(timeString)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 曜日ユーティリティ
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export function getDayName(day: DayOfWeek): string {
  const days = ['月', '火', '水', '木', '金', '土', '日']
  return days[day - 1]
}

export function getDaysOfWeekText(daysString?: string): string {
  if (!daysString) return '毎日'
  
  const days = daysString.split(',').map(Number) as DayOfWeek[]
  if (days.length === 7) return '毎日'
  
  const dayNames = days.map(getDayName)
  return dayNames.join('、')
}

// 時間範囲ユーティリティ
export function getTimeOfDayCategory(time: string): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = parseInt(time.split(':')[0])
  
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
}

export function getTimeOfDayCategoryText(category: string): string {
  switch (category) {
    case 'morning':
      return '朝'
    case 'afternoon':
      return '昼'
    case 'evening':
      return '夕'
    case 'night':
      return '夜'
    default:
      return ''
  }
}

// ローカルストレージ用ユーティリティ
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage が使用できない場合は何もしない
  }
}

// API エラーハンドリング
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '予期しないエラーが発生しました'
}

// デバウンス関数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// 時間文字列をDateオブジェクトに変換
export function timeStringToDate(timeString: string, baseDate?: Date): Date {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = baseDate ? new Date(baseDate) : new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

// 配列をグループ化
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item)
    groups[key] = groups[key] || []
    groups[key].push(item)
    return groups
  }, {} as Record<string, T[]>)
}