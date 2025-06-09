import type { User } from './user'
import type { Medicine } from './medicine'
import type { MedicationLog } from './medication'
import type { DashboardData } from './dashboard'

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