// Zustand Store - 状態管理

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import { User, Medicine, MedicationLog, DashboardData, NotificationSettings } from '@/types'

// アプリケーション全体の状態
interface AppState {
  // ユーザー関連
  user: User | null
  isAuthenticated: boolean
  
  // データ
  medicines: Medicine[]
  logs: MedicationLog[]
  dashboardData: DashboardData | null
  
  // UI状態
  isLoading: boolean
  error: string | null
  
  // 設定
  notificationSettings: NotificationSettings
  theme: 'light' | 'dark' | 'system'
  
  // モーダル・ダイアログ状態
  modals: {
    addMedicine: boolean
    editMedicine: Medicine | null
    medicationLog: MedicationLog | null
    settings: boolean
  }
}

interface AppActions {
  // ユーザー関連アクション
  setUser: (user: User | null) => void
  login: (user: User, token: string) => void
  logout: () => void
  
  // 薬関連アクション
  setMedicines: (medicines: Medicine[]) => void
  addMedicine: (medicine: Medicine) => void
  updateMedicine: (id: number, updates: Partial<Medicine>) => void
  deleteMedicine: (id: number) => void
  
  // 服薬記録関連アクション
  setLogs: (logs: MedicationLog[]) => void
  addLog: (log: MedicationLog) => void
  updateLog: (id: number, updates: Partial<MedicationLog>) => void
  deleteLog: (id: number) => void
  
  // ダッシュボード関連アクション
  setDashboardData: (data: DashboardData) => void
  
  // UI状態アクション
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // 設定関連アクション
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // モーダル・ダイアログアクション
  openAddMedicineModal: () => void
  closeAddMedicineModal: () => void
  openEditMedicineModal: (medicine: Medicine) => void
  closeEditMedicineModal: () => void
  openMedicationLogModal: (log: MedicationLog) => void
  closeMedicationLogModal: () => void
  openSettingsModal: () => void
  closeSettingsModal: () => void
  
  // ヘルパーアクション
  getMedicineById: (id: number) => Medicine | undefined
  getLogsByMedicineId: (medicineId: number) => MedicationLog[]
  getTodayLogs: () => MedicationLog[]
  getPendingLogs: () => MedicationLog[]
}

type AppStore = AppState & AppActions

// デフォルト設定
const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  reminderMinutes: 0,
  missedMedicationMinutes: 30,
  weeklyReportEnabled: true,
  weeklyReportDay: 0, // Sunday
}

// メインストア
export const useAppStore = create<AppStore>()(
  persist(
    immer((set, get) => ({
      // 初期状態
      user: null,
      isAuthenticated: false,
      medicines: [],
      logs: [],
      dashboardData: null,
      isLoading: false,
      error: null,
      notificationSettings: defaultNotificationSettings,
      theme: 'system',
      modals: {
        addMedicine: false,
        editMedicine: null,
        medicationLog: null,
        settings: false,
      },

      // ユーザー関連アクション
      setUser: (user) =>
        set((state) => {
          state.user = user
          state.isAuthenticated = !!user
        }),

      login: (user, token) =>
        set((state) => {
          state.user = user
          state.isAuthenticated = true
          localStorage.setItem('auth_token', token)
        }),

      logout: () =>
        set((state) => {
          state.user = null
          state.isAuthenticated = false
          state.medicines = []
          state.logs = []
          state.dashboardData = null
          localStorage.removeItem('auth_token')
        }),

      // 薬関連アクション
      setMedicines: (medicines) =>
        set((state) => {
          state.medicines = medicines
        }),

      addMedicine: (medicine) =>
        set((state) => {
          state.medicines.push(medicine)
        }),

      updateMedicine: (id, updates) =>
        set((state) => {
          const index = state.medicines.findIndex((m) => m.id === id)
          if (index !== -1) {
            Object.assign(state.medicines[index], updates)
          }
        }),

      deleteMedicine: (id) =>
        set((state) => {
          state.medicines = state.medicines.filter((m) => m.id !== id)
          state.logs = state.logs.filter((l) => l.medicineId !== id)
        }),

      // 服薬記録関連アクション
      setLogs: (logs) =>
        set((state) => {
          state.logs = logs
        }),

      addLog: (log) =>
        set((state) => {
          state.logs.push(log)
        }),

      updateLog: (id, updates) =>
        set((state) => {
          const index = state.logs.findIndex((l) => l.id === id)
          if (index !== -1) {
            Object.assign(state.logs[index], updates)
          }
        }),

      deleteLog: (id) =>
        set((state) => {
          state.logs = state.logs.filter((l) => l.id !== id)
        }),

      // ダッシュボード関連アクション
      setDashboardData: (data) =>
        set((state) => {
          state.dashboardData = data
        }),

      // UI状態アクション
      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading
        }),

      setError: (error) =>
        set((state) => {
          state.error = error
        }),

      clearError: () =>
        set((state) => {
          state.error = null
        }),

      // 設定関連アクション
      updateNotificationSettings: (settings) =>
        set((state) => {
          Object.assign(state.notificationSettings, settings)
        }),

      setTheme: (theme) =>
        set((state) => {
          state.theme = theme
        }),

      // モーダル・ダイアログアクション
      openAddMedicineModal: () =>
        set((state) => {
          state.modals.addMedicine = true
        }),

      closeAddMedicineModal: () =>
        set((state) => {
          state.modals.addMedicine = false
        }),

      openEditMedicineModal: (medicine) =>
        set((state) => {
          state.modals.editMedicine = medicine
        }),

      closeEditMedicineModal: () =>
        set((state) => {
          state.modals.editMedicine = null
        }),

      openMedicationLogModal: (log) =>
        set((state) => {
          state.modals.medicationLog = log
        }),

      closeMedicationLogModal: () =>
        set((state) => {
          state.modals.medicationLog = null
        }),

      openSettingsModal: () =>
        set((state) => {
          state.modals.settings = true
        }),

      closeSettingsModal: () =>
        set((state) => {
          state.modals.settings = false
        }),

      // ヘルパーアクション
      getMedicineById: (id) => {
        const state = get()
        return state.medicines.find((m) => m.id === id)
      },

      getLogsByMedicineId: (medicineId) => {
        const state = get()
        return state.logs.filter((l) => l.medicineId === medicineId)
      },

      getTodayLogs: () => {
        const state = get()
        const today = new Date().toISOString().split('T')[0]
        return state.logs.filter((l) => l.scheduledTime.startsWith(today))
      },

      getPendingLogs: () => {
        const state = get()
        return state.logs.filter((l) => l.status === 'pending')
      },
    })),
    {
      name: 'medication-reminder-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        notificationSettings: state.notificationSettings,
        theme: state.theme,
      }),
    }
  )
)

// 個別のセレクター（パフォーマンス最適化用）
export const useUser = () => useAppStore((state) => state.user)
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated)
export const useMedicines = () => useAppStore((state) => state.medicines)
export const useLogs = () => useAppStore((state) => state.logs)
export const useDashboardData = () => useAppStore((state) => state.dashboardData)
export const useIsLoading = () => useAppStore((state) => state.isLoading)
export const useError = () => useAppStore((state) => state.error)
export const useNotificationSettings = () => useAppStore((state) => state.notificationSettings)
export const useTheme = () => useAppStore((state) => state.theme)
export const useModals = () => useAppStore((state) => state.modals)

// アクションのみのセレクター
export const useAppActions = () =>
  useAppStore((state) => ({
    setUser: state.setUser,
    login: state.login,
    logout: state.logout,
    setMedicines: state.setMedicines,
    addMedicine: state.addMedicine,
    updateMedicine: state.updateMedicine,
    deleteMedicine: state.deleteMedicine,
    setLogs: state.setLogs,
    addLog: state.addLog,
    updateLog: state.updateLog,
    deleteLog: state.deleteLog,
    setDashboardData: state.setDashboardData,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    updateNotificationSettings: state.updateNotificationSettings,
    setTheme: state.setTheme,
    openAddMedicineModal: state.openAddMedicineModal,
    closeAddMedicineModal: state.closeAddMedicineModal,
    openEditMedicineModal: state.openEditMedicineModal,
    closeEditMedicineModal: state.closeEditMedicineModal,
    openMedicationLogModal: state.openMedicationLogModal,
    closeMedicationLogModal: state.closeMedicationLogModal,
    openSettingsModal: state.openSettingsModal,
    closeSettingsModal: state.closeSettingsModal,
    getMedicineById: state.getMedicineById,
    getLogsByMedicineId: state.getLogsByMedicineId,
    getTodayLogs: state.getTodayLogs,
    getPendingLogs: state.getPendingLogs,
  }))

// 特化したセレクター
export const useTodayStats = () =>
  useAppStore((state) => {
    const todayLogs = state.logs.filter((l) => {
      const today = new Date().toISOString().split('T')[0]
      return l.scheduledTime.startsWith(today)
    })

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

export const useActiveMedicines = () =>
  useAppStore((state) => state.medicines.filter((m) => m.active))

export const usePendingMedications = () =>
  useAppStore((state) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    return state.logs.filter((l) => 
      l.status === 'pending' && 
      l.scheduledTime.startsWith(today) &&
      new Date(l.scheduledTime) <= now
    )
  })