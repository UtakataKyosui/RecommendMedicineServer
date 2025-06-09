import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Pill, 
  ClipboardList,
  Calendar,
  Settings as SettingsIcon, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useAppActions, useUser } from '@/store'
import { useState } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'ダッシュボード', href: '/', icon: Home },
  { name: '薬一覧', href: '/medicines', icon: Pill },
  { name: 'スケジュール', href: '/schedules', icon: Calendar },
  { name: '服薬記録', href: '/logs', icon: ClipboardList },
  { name: '設定', href: '/settings', icon: SettingsIcon },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const user = useUser()
  const { logout } = useAppActions()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* モバイルメニューオーバーレイ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* サイドバー */}
      <div className={`
        sidebar-solid fixed inset-y-0 left-0 z-50 w-64 border-r border-elevated-border shadow-xl transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* ロゴエリア */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <h1 className="text-xl font-semibold text-foreground">薬管理システム</h1>
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-cute-pink/10 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* ナビゲーション */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer border-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95
                    ${isActive 
                      ? 'bg-gradient-to-r from-cute-pink to-cute-lavender text-primary-foreground border-cute-pink shadow-lg shadow-cute-pink/30' 
                      : 'bg-elevated text-foreground border-cute-pink/30 hover:bg-gradient-to-r hover:from-cute-pink/10 hover:to-cute-lavender/5 hover:text-cute-pink hover:border-cute-pink/50 hover:shadow-cute-pink/20'
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* ユーザー情報 */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cute-pink to-cute-lavender rounded-full flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.displayName || 'ユーザー'}
                </p>
                <p className="text-xs text-foreground/60 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="lg:pl-64">
        {/* トップバー */}
        <div className="sticky top-0 z-40 bg-elevated shadow-sm border-b border-elevated-border">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-foreground/70 hover:text-cute-pink hover:bg-cute-pink/10 transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground/70">
                {new Date().toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* ページコンテンツ */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}