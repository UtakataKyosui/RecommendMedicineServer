import type { MedicationLog, MedicationStatus } from './medication'

// Dashboard Types
export interface DashboardData {
  todaySchedules: TodaySchedule[]
  upcomingSchedules: UpcomingSchedule[]
  weeklyStats: WeeklyStats
  recentLogs: MedicationLog[]
}

export interface TodaySchedule {
  id: number
  medicineId: number
  medicineName: string
  dosage?: string
  scheduledTime: string
  status: MedicationStatus
  logId?: number
}

export interface UpcomingSchedule {
  id: number
  medicineId: number
  medicineName: string
  dosage?: string
  scheduledTime: string
  daysUntil: number
}

export interface WeeklyStats {
  totalScheduled: number
  totalCompleted: number
  adherenceRate: number
  dailyStats: DailyStats[]
}

export interface DailyStats {
  date: string
  scheduled: number
  completed: number
  adherenceRate: number
}