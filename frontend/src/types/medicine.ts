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

// Filter and Sort Types
export interface MedicineFilter {
  search?: string
  active?: boolean
  hasSchedules?: boolean
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig<T = string> {
  key: T
  direction: SortDirection
}