// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// User Types
export interface User {
  id: number
  email: string
  lineUserId?: string
  displayName?: string
  timezone?: string
  notificationEnabled: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  id: number
  displayName?: string
  timezone: string
  notificationEnabled: boolean
  lineUserId?: string
}

// Medicine Types
export interface Medicine {
  id: number
  name: string
  description?: string
  dosage?: string
  unit?: string
  userId: number
  active: boolean
  schedules: MedicationSchedule[]
  createdAt: string
  updatedAt: string
}

export interface CreateMedicineRequest {
  name: string
  description?: string
  dosage?: string
  unit?: string
  schedules: CreateScheduleRequest[]
}

export interface UpdateMedicineRequest {
  name?: string
  description?: string
  dosage?: string
  unit?: string
  active?: boolean
}

// Medication Schedule Types
export interface MedicationSchedule {
  id: number
  medicineId: number
  scheduledTime: string // "HH:mm" format
  frequency: 'daily' | 'weekly' | 'custom'
  active: boolean
  daysOfWeek?: string // "1,2,3,4,5" comma-separated
  createdAt: string
  updatedAt: string
}

export interface CreateScheduleRequest {
  scheduledTime: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: string
}

export interface UpdateScheduleRequest {
  scheduledTime?: string
  frequency?: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: string
  active?: boolean
}

// Medication Log Types
export type MedicationStatus = 'pending' | 'completed' | 'missed' | 'skipped'

export interface MedicationLog {
  id: number
  medicineId: number
  scheduledTime: string
  takenTime?: string
  status: MedicationStatus
  notes?: string
  medicine?: Medicine
  createdAt: string
  updatedAt: string
}

export interface CreateLogRequest {
  medicineId: number
  scheduledTime: string
  status: MedicationStatus
  takenTime?: string
  notes?: string
}

export interface UpdateLogRequest {
  status?: MedicationStatus
  takenTime?: string
  notes?: string
}

// Report Types
export interface MedicationReport {
  userId: number
  reportType: 'daily' | 'weekly' | 'monthly'
  period: string
  summary: ReportSummary
  medicines: MedicineReport[]
  recommendations: string[]
  generatedAt: string
}

export interface ReportSummary {
  totalScheduled: number
  totalTaken: number
  totalMissed: number
  adherenceRate: number
  mostMissedTime?: string
  bestAdherenceMedicine?: string
  worstAdherenceMedicine?: string
}

export interface MedicineReport {
  medicineId: number
  medicineName: string
  scheduledCount: number
  takenCount: number
  missedCount: number
  adherenceRate: number
  missedTimes: string[]
}

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

// Form Types
export interface MedicineFormData {
  name: string
  description?: string
  dosage?: string
  unit?: string
  schedules: ScheduleFormData[]
}

export interface ScheduleFormData {
  scheduledTime: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek: number[]
}

export interface UserSettingsFormData {
  displayName?: string
  timezone: string
  notificationEnabled: boolean
}

// Chart Data Types
export interface ChartDataPoint {
  date: string
  scheduled: number
  completed: number
  adherenceRate: number
}

export interface MedicineChartData {
  medicineName: string
  data: ChartDataPoint[]
}

// Filter and Sort Types
export interface MedicineFilter {
  search?: string
  active?: boolean
  hasSchedules?: boolean
}

export interface LogFilter {
  medicineId?: number
  status?: MedicationStatus[]
  dateFrom?: string
  dateTo?: string
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T = string> {
  key: T
  direction: SortDirection
}

// Notification Types
export interface NotificationSettings {
  enabled: boolean
  reminderMinutes: number
  missedMedicationMinutes: number
  weeklyReportEnabled: boolean
  weeklyReportDay: number // 0 = Sunday, 1 = Monday, etc.
}

// Error Types
export interface ApiError {
  message: string
  code?: string
  field?: string
}

export interface ValidationError {
  field: string
  message: string
}

// Zustand Store Types
export interface AppState {
  user: User | null
  medicines: Medicine[]
  logs: MedicationLog[]
  dashboardData: DashboardData | null
  isLoading: boolean
  error: string | null
}

export interface AppActions {
  setUser: (user: User | null) => void
  setMedicines: (medicines: Medicine[]) => void
  addMedicine: (medicine: Medicine) => void
  updateMedicine: (id: number, updates: Partial<Medicine>) => void
  deleteMedicine: (id: number) => void
  setLogs: (logs: MedicationLog[]) => void
  addLog: (log: MedicationLog) => void
  updateLog: (id: number, updates: Partial<MedicationLog>) => void
  setDashboardData: (data: DashboardData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// React Query Keys
export const QueryKeys = {
  user: ['user'] as const,
  medicines: ['medicines'] as const,
  medicine: (id: number) => ['medicine', id] as const,
  logs: ['logs'] as const,
  medicationLogs: (filters: LogFilter) => ['logs', filters] as const,
  dashboard: ['dashboard'] as const,
  report: (type: string, period: string) => ['report', type, period] as const,
} as const

// Hook Options
export interface UseApiOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  staleTime?: number
  gcTime?: number
}