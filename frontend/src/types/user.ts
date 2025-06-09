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

export interface UserSettingsFormData {
  displayName?: string
  timezone: string
  notificationEnabled: boolean
}

// Notification Types
export interface NotificationSettings {
  enabled: boolean
  reminderMinutes: number
  missedMedicationMinutes: number
  weeklyReportEnabled: boolean
  weeklyReportDay: number // 0 = Sunday, 1 = Monday, etc.
}