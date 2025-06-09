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