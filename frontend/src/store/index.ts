// Jotai Store - 状態管理

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type { 
  User, 
  Medicine, 
  MedicationLog, 
  DashboardData, 
  NotificationSettings, 
  MedicationStatus 
} from '@/types'

// デフォルト設定
const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  reminderMinutes: 0,
  missedMedicationMinutes: 30,
  weeklyReportEnabled: true,
  weeklyReportDay: 0, // Sunday
}

// 基本状態のatoms
export const userAtom = atomWithStorage<User | null>('user', null)

export const isAuthenticatedAtom = atomWithStorage<boolean>('isAuthenticated', false)

export const medicinesAtom = atom<Medicine[]>([])

export const logsAtom = atom<MedicationLog[]>([])

export const dashboardDataAtom = atom<DashboardData | null>(null)
export const isLoadingAtom = atom<boolean>(false)
export const errorAtom = atom<string | null>(null)
export const notificationSettingsAtom = atomWithStorage<NotificationSettings>('notificationSettings', defaultNotificationSettings)
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme', 'system')

// モーダル状態のatoms
export const addMedicineModalAtom = atom<boolean>(false)
export const editMedicineModalAtom = atom<Medicine | null>(null)
export const medicationLogModalAtom = atom<MedicationLog | null>(null)
export const settingsModalAtom = atom<boolean>(false)

// ヘルパー関数 - 日付関連のキャッシュ
const getTodayString = () => {
  return new Date().toISOString().split('T')[0]
}

let cachedToday = ''
let cachedTodayTime = 0
const getCachedToday = () => {
  const now = Date.now()
  if (now - cachedTodayTime > 60000) { // 1分でキャッシュ更新
    cachedToday = getTodayString()
    cachedTodayTime = now
  }
  return cachedToday
}

// 計算されたatoms（derived atoms）
export const activeMedicinesAtom = atom((get) => {
  const medicines = get(medicinesAtom)
  return medicines.filter((m) => m.active)
})

export const todayStatsAtom = atom((get) => {
  const logs = get(logsAtom)
  const today = getCachedToday()
  const todayLogs = logs.filter((l) => l.scheduledTime.startsWith(today))

  const total = todayLogs.length
  const completed = todayLogs.filter((l) => l.status === 'completed').length
  const pending = todayLogs.filter((l) => l.status === 'pending').length
  const missed = todayLogs.filter((l) => l.status === 'missed').length

  return {
    total,
    completed,
    pending,
    missed,
    adherenceRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
})

export const pendingMedicationsAtom = atom((get) => {
  const logs = get(logsAtom)
  const today = getCachedToday()
  const nowTime = Date.now()
  
  return logs.filter((l) => 
    l.status === 'pending' && 
    l.scheduledTime.startsWith(today) &&
    new Date(l.scheduledTime).getTime() <= nowTime
  )
})

export const todayLogsAtom = atom((get) => {
  const logs = get(logsAtom)
  const today = getCachedToday()
  return logs.filter((l) => l.scheduledTime.startsWith(today))
})

export const pendingLogsAtom = atom((get) => {
  const logs = get(logsAtom)
  return logs.filter((l) => l.status === 'pending')
})

// アクション用のatoms（write-only atoms）
export const loginAtom = atom(
  null,
  (_get, set, { user, token }: { user: User; token: string }) => {
    set(userAtom, user)
    set(isAuthenticatedAtom, true)
    localStorage.setItem('auth_token', token)
    
    // ログイン時にサンプルデータを設定
    const sampleMedicines = [
      {
        id: 1,
        name: 'ビタミンD',
        description: '骨の健康をサポート',
        dosage: '1',
        unit: '錠',
        userId: user.id,
        active: true,
        schedules: [
          {
            id: 1,
            medicineId: 1,
            scheduledTime: '08:00',
            frequency: 'daily' as const,
            active: true,
            daysOfWeek: '1,2,3,4,5,6,0',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        name: '血圧の薬',
        description: '高血圧治療薬',
        dosage: '0.5',
        unit: '錠',
        userId: user.id,
        active: true,
        schedules: [
          {
            id: 2,
            medicineId: 2,
            scheduledTime: '07:30',
            frequency: 'daily' as const,
            active: true,
            daysOfWeek: '1,2,3,4,5,6,0',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          },
          {
            id: 3,
            medicineId: 2,
            scheduledTime: '19:30',
            frequency: 'daily' as const,
            active: true,
            daysOfWeek: '1,2,3,4,5,6,0',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ]
    
    // 今日の日付でサンプルログを生成
    const today = new Date().toISOString().split('T')[0]
    const sampleLogs = [
      {
        id: 1,
        medicineId: 1,
        scheduledTime: `${today}T08:00:00.000Z`,
        takenTime: `${today}T08:05:00.000Z`,
        status: 'completed' as const,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        medicineId: 2,
        scheduledTime: `${today}T07:30:00.000Z`,
        takenTime: `${today}T07:35:00.000Z`,
        status: 'completed' as const,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        medicineId: 2,
        scheduledTime: `${today}T19:30:00.000Z`,
        status: 'pending' as const,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
    
    set(medicinesAtom, sampleMedicines)
    set(logsAtom, sampleLogs)
  }
)

export const logoutAtom = atom(
  null,
  (_get, set) => {
    set(userAtom, null)
    set(isAuthenticatedAtom, false)
    set(medicinesAtom, [])
    set(logsAtom, [])
    set(dashboardDataAtom, null)
    localStorage.removeItem('auth_token')
  }
)

export const addMedicineAtom = atom(
  null,
  (get, set, medicine: Medicine) => {
    const medicines = get(medicinesAtom)
    set(medicinesAtom, [...medicines, medicine])
  }
)

export const updateMedicineAtom = atom(
  null,
  (get, set, { id, updates }: { id: number; updates: Partial<Medicine> }) => {
    const medicines = get(medicinesAtom)
    const index = medicines.findIndex((m) => m.id === id)
    if (index !== -1) {
      const updatedMedicines = [...medicines]
      updatedMedicines[index] = { ...updatedMedicines[index], ...updates }
      set(medicinesAtom, updatedMedicines)
    }
  }
)

export const deleteMedicineAtom = atom(
  null,
  (get, set, id: number) => {
    const medicines = get(medicinesAtom)
    const logs = get(logsAtom)
    set(medicinesAtom, medicines.filter((m) => m.id !== id))
    set(logsAtom, logs.filter((l) => l.medicineId !== id))
  }
)

export const addLogAtom = atom(
  null,
  (get, set, log: MedicationLog) => {
    const logs = get(logsAtom)
    set(logsAtom, [...logs, log])
  }
)

export const updateLogAtom = atom(
  null,
  (get, set, { id, updates }: { id: number; updates: Partial<MedicationLog> }) => {
    const logs = get(logsAtom)
    const index = logs.findIndex((l) => l.id === id)
    if (index !== -1) {
      const updatedLogs = [...logs]
      updatedLogs[index] = { ...updatedLogs[index], ...updates }
      set(logsAtom, updatedLogs)
    }
  }
)

export const deleteLogAtom = atom(
  null,
  (get, set, id: number) => {
    const logs = get(logsAtom)
    set(logsAtom, logs.filter((l) => l.id !== id))
  }
)

// ヘルパー関数のatoms
export const getMedicineByIdAtom = atom(
  null,
  (get, _set, id: number) => {
    const medicines = get(medicinesAtom)
    return medicines.find((m) => m.id === id)
  }
)

export const getLogsByMedicineIdAtom = atom(
  null,
  (get, _set, medicineId: number) => {
    const logs = get(logsAtom)
    return logs.filter((l) => l.medicineId === medicineId)
  }
)

// 便利なフック
export const useUser = () => useAtomValue(userAtom)
export const useIsAuthenticated = () => useAtomValue(isAuthenticatedAtom)
export const useMedicines = () => useAtomValue(medicinesAtom)
export const useLogs = () => useAtomValue(logsAtom)
export const useDashboardData = () => useAtomValue(dashboardDataAtom)
export const useIsLoading = () => useAtomValue(isLoadingAtom)
export const useError = () => useAtomValue(errorAtom)
export const useNotificationSettings = () => useAtomValue(notificationSettingsAtom)
export const useTheme = () => useAtomValue(themeAtom)

export const useActiveMedicines = () => useAtomValue(activeMedicinesAtom)
export const useTodayStats = () => useAtomValue(todayStatsAtom)
export const usePendingMedications = () => useAtomValue(pendingMedicationsAtom)

// モーダル状態用のフック
export const useModals = () => ({
  addMedicine: useAtomValue(addMedicineModalAtom),
  editMedicine: useAtomValue(editMedicineModalAtom),
  medicationLog: useAtomValue(medicationLogModalAtom),
  settings: useAtomValue(settingsModalAtom),
})

// アクション用のフック
export const useAppActions = () => {
  const setUser = useSetAtom(userAtom)
  const [, login] = useAtom(loginAtom)
  const [, logout] = useAtom(logoutAtom)
  const setMedicines = useSetAtom(medicinesAtom)
  const [, addMedicine] = useAtom(addMedicineAtom)
  const [, updateMedicine] = useAtom(updateMedicineAtom)
  const [, deleteMedicine] = useAtom(deleteMedicineAtom)
  const setLogs = useSetAtom(logsAtom)
  const [, addLog] = useAtom(addLogAtom)
  const [, updateLog] = useAtom(updateLogAtom)
  const [, deleteLog] = useAtom(deleteLogAtom)
  const setDashboardData = useSetAtom(dashboardDataAtom)
  const setLoading = useSetAtom(isLoadingAtom)
  const setError = useSetAtom(errorAtom)
  const updateNotificationSettings = useSetAtom(notificationSettingsAtom)
  const setTheme = useSetAtom(themeAtom)
  
  // モーダル操作
  const setAddMedicineModal = useSetAtom(addMedicineModalAtom)
  const setEditMedicineModal = useSetAtom(editMedicineModalAtom)
  const setMedicationLogModal = useSetAtom(medicationLogModalAtom)
  const setSettingsModal = useSetAtom(settingsModalAtom)
  
  // ヘルパー関数
  const [, getMedicineById] = useAtom(getMedicineByIdAtom)
  const [, getLogsByMedicineId] = useAtom(getLogsByMedicineIdAtom)
  const getTodayLogs = useAtomValue(todayLogsAtom)
  const getPendingLogs = useAtomValue(pendingLogsAtom)

  return {
    setUser,
    login,
    logout,
    setMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    setLogs,
    addLog,
    updateLog,
    deleteLog,
    setDashboardData,
    setLoading,
    setError,
    clearError: () => setError(null),
    updateNotificationSettings,
    setTheme,
    openAddMedicineModal: () => setAddMedicineModal(true),
    closeAddMedicineModal: () => setAddMedicineModal(false),
    openEditMedicineModal: (medicine: Medicine) => setEditMedicineModal(medicine),
    closeEditMedicineModal: () => setEditMedicineModal(null),
    openMedicationLogModal: (log: MedicationLog) => setMedicationLogModal(log),
    closeMedicationLogModal: () => setMedicationLogModal(null),
    openSettingsModal: () => setSettingsModal(true),
    closeSettingsModal: () => setSettingsModal(false),
    getMedicineById,
    getLogsByMedicineId,
    getTodayLogs,
    getPendingLogs,
  }
}