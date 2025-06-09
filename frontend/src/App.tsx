import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { Provider as JotaiProvider } from 'jotai'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { MedicineList } from '@/components/medicine'
import { MedicationLogs } from '@/components/MedicationLogs'
import { ScheduleManagement } from '@/components/ScheduleManagement'
import { Settings } from '@/components/Settings'
import { useIsAuthenticated, useTheme, useAppActions } from '@/store'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      gcTime: 1000 * 60 * 10, // 10分
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthenticatedApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/medicines" element={<MedicineList />} />
        <Route path="/schedules" element={<ScheduleManagement />} />
        <Route path="/logs" element={<MedicationLogs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function UnauthenticatedApp() {
  const { login } = useAppActions()

  const handleMockLogin = () => {
    // モックユーザーデータでログイン
    const mockUser = {
      id: 1,
      email: 'demo@example.com',
      displayName: 'デモユーザー',
      timezone: 'Asia/Tokyo',
      notificationEnabled: true,
      lineUserId: 'mock_line_user_123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const mockToken = 'mock_jwt_token_for_demo'
    
    // ログイン処理を実行
    login({ user: mockUser, token: mockToken })
    
    console.log('モックログイン実行:', mockUser)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gradient-from/10 via-background to-gradient-to/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-gradient-from/20 to-gradient-to/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-gradient-to/20 to-gradient-from/20 rounded-full blur-3xl" />
      
      <div className="max-w-md w-full bg-elevated rounded-2xl shadow-2xl border-2 border-elevated-border p-8 text-center relative z-10">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-cute-pink via-cute-lavender to-cute-peach rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-cute-pink/30">
            <span className="text-3xl">💊</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cute-pink to-cute-lavender bg-clip-text text-transparent mb-2">薬管理システム</h1>
          <p className="text-muted-foreground">可愛く管理する服薬スケジュール 💕</p>
        </div>
        
        <div className="space-y-3">
          <button 
            className="w-full bg-gradient-to-r from-cute-pink to-cute-lavender text-primary-foreground py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-cute-pink/30 hover:scale-105 transition-all duration-200 font-medium cursor-pointer border-2 border-cute-pink"
            onClick={handleMockLogin}
          >
            デモログイン（開発用） ✨
          </button>
          
          <button 
            className="w-full bg-elevated border-2 border-cute-pink/30 text-foreground py-3 px-6 rounded-xl hover:bg-cute-pink/5 hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium cursor-pointer"
            onClick={() => {
              console.log('LINEログイン（未実装）')
              alert('LINEログインは今後実装予定です 🌸')
            }}
          >
            LINEでログイン（未実装） 🌸
          </button>
          
          <button 
            className="w-full bg-cute-mint/20 text-cute-mint py-2 px-4 rounded-lg hover:bg-cute-mint/30 transition-all duration-200 text-sm cursor-pointer"
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
          >
            データリセット（開発用） 🔄
          </button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          ※ デモログインで可愛いUIを確認できます 💖
        </p>
      </div>
    </div>
  )
}

function App() {
  const isAuthenticated = useIsAuthenticated()
  const theme = useTheme()

  // Apply theme to document
  React.useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-background transition-colors duration-300">
            {isAuthenticated ? <AuthenticatedApp /> : <UnauthenticatedApp />}
            <Toaster position="top-right" />
          </div>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </JotaiProvider>
  )
}

export default App
