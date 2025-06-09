import type { Medicine } from './medicine'

// Medication Status
export type MedicationStatus = 'pending' | 'completed' | 'missed' | 'skipped'

// Medication Log Types
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

export interface LogFilter {
  medicineId?: number
  status?: MedicationStatus[]
  dateFrom?: string
  dateTo?: string
}