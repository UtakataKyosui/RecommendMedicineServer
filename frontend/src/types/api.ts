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

// React Query Keys
export const QueryKeys = {
  user: ['user'] as const,
  medicines: ['medicines'] as const,
  medicine: (id: number) => ['medicine', id] as const,
  logs: ['logs'] as const,
  medicationLogs: (filters: any) => ['logs', filters] as const,
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