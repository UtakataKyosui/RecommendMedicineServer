import React, { useState } from 'react'
import { 
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  ExternalLink,
  Save,
  Trash2
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input,
  Label,
  Badge
} from '@/components/ui'
import { 
  useUser, 
  useNotificationSettings, 
  useTheme, 
  useAppActions 
} from '@/store'
import type { UserSettingsFormData, NotificationSettings } from '@/types'

function ProfileSection() {
  const user = useUser()
  const { setUser } = useAppActions()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UserSettingsFormData>({
    displayName: user?.displayName || '',
    timezone: user?.timezone || 'Asia/Tokyo',
    notificationEnabled: user?.notificationEnabled ?? true
  })

  const handleSave = () => {
    if (user) {
      setUser({
        ...user,
        displayName: formData.displayName,
        timezone: formData.timezone,
        notificationEnabled: formData.notificationEnabled
      })
    }
    setIsEditing(false)
  }

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <User className="mr-2 h-5 w-5" />
          プロフィール
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-foreground">メールアドレス</Label>
          <Input value={user?.email || ''} disabled className="mt-1 bg-surface/60 border-border text-foreground" />
        </div>

        <div>
          <Label htmlFor="displayName" className="text-foreground">表示名</Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            disabled={!isEditing}
            className="mt-1 bg-surface/60 border-border text-foreground"
            placeholder="表示名を入力"
          />
        </div>

        <div>
          <Label htmlFor="timezone" className="text-foreground">タイムゾーン</Label>
          <select
            id="timezone"
            value={formData.timezone}
            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            disabled={!isEditing}
            className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-surface/40 disabled:text-foreground/60 bg-surface/60 text-foreground backdrop-blur-sm"
          >
            <option value="Asia/Tokyo">日本 (Asia/Tokyo)</option>
            <option value="Asia/Seoul">韓国 (Asia/Seoul)</option>
            <option value="Asia/Shanghai">中国 (Asia/Shanghai)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="notificationEnabled"
            checked={formData.notificationEnabled}
            onChange={(e) => setFormData(prev => ({ ...prev, notificationEnabled: e.target.checked }))}
            disabled={!isEditing}
            className="rounded border-input"
          />
          <Label htmlFor="notificationEnabled" className="text-foreground">通知を有効にする</Label>
        </div>

        {user?.lineUserId && (
          <div className="flex items-center justify-between p-3 bg-green-100/80 backdrop-blur-sm border border-green-200/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-green-900">LINE Bot連携済み</p>
              <p className="text-xs text-green-700">ID: {user.lineUserId}</p>
            </div>
            <Badge variant="success">連携済み</Badge>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              編集
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationSection() {
  const notificationSettings = useNotificationSettings()
  const { updateNotificationSettings } = useAppActions()
  const [isEditing, setIsEditing] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>(notificationSettings)

  const handleSave = () => {
    updateNotificationSettings(settings)
    setIsEditing(false)
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Bell className="mr-2 h-5 w-5" />
          通知設定
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="enabled"
            checked={settings.enabled}
            onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
            disabled={!isEditing}
            className="rounded border-input"
          />
          <Label htmlFor="enabled" className="text-foreground">通知を有効にする</Label>
        </div>

        {settings.enabled && (
          <>
            <div>
              <Label htmlFor="reminderMinutes" className="text-foreground">服薬前の通知 (分前)</Label>
              <select
                id="reminderMinutes"
                value={settings.reminderMinutes}
                onChange={(e) => setSettings(prev => ({ ...prev, reminderMinutes: parseInt(e.target.value) }))}
                disabled={!isEditing}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-surface/40 disabled:text-foreground/60 bg-surface/60 text-foreground backdrop-blur-sm"
              >
                <option value={0}>服薬時刻に通知</option>
                <option value={5}>5分前</option>
                <option value={10}>10分前</option>
                <option value={15}>15分前</option>
                <option value={30}>30分前</option>
              </select>
            </div>

            <div>
              <Label htmlFor="missedMedicationMinutes" className="text-foreground">未服薬の通知 (分後)</Label>
              <select
                id="missedMedicationMinutes"
                value={settings.missedMedicationMinutes}
                onChange={(e) => setSettings(prev => ({ ...prev, missedMedicationMinutes: parseInt(e.target.value) }))}
                disabled={!isEditing}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-surface/40 disabled:text-foreground/60 bg-surface/60 text-foreground backdrop-blur-sm"
              >
                <option value={0}>通知しない</option>
                <option value={15}>15分後</option>
                <option value={30}>30分後</option>
                <option value={60}>1時間後</option>
                <option value={120}>2時間後</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="weeklyReportEnabled"
                checked={settings.weeklyReportEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, weeklyReportEnabled: e.target.checked }))}
                disabled={!isEditing}
                className="rounded border-input"
              />
              <Label htmlFor="weeklyReportEnabled" className="text-foreground">週次レポートを受信</Label>
            </div>

            {settings.weeklyReportEnabled && (
              <div>
                <Label htmlFor="weeklyReportDay" className="text-foreground">レポート送信日</Label>
                <select
                  id="weeklyReportDay"
                  value={settings.weeklyReportDay}
                  onChange={(e) => setSettings(prev => ({ ...prev, weeklyReportDay: parseInt(e.target.value) }))}
                  disabled={!isEditing}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring disabled:bg-surface/40 disabled:text-foreground/60 bg-surface/60 text-foreground backdrop-blur-sm"
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>{day}曜日</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                保存
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              編集
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AppearanceSection() {
  const theme = useTheme()
  const { setTheme } = useAppActions()

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Palette className="mr-2 h-5 w-5" />
          表示設定
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <Label className="text-foreground">テーマ</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              size="sm"
            >
              ライト
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              size="sm"
            >
              ダーク
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              size="sm"
            >
              システム
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SecuritySection() {
  const { logout, login } = useAppActions()

  const handleDeleteAccount = () => {
    if (confirm('アカウントを削除しますか？この操作は取り消せません。')) {
      // TODO: アカウント削除API呼び出し
      console.log('アカウント削除')
    }
  }

  const handleMockLogin = () => {
    // 別のモックユーザーでログイン
    const mockUser = {
      id: 2,
      email: 'test@example.com',
      displayName: 'テストユーザー',
      timezone: 'Asia/Tokyo',
      notificationEnabled: false,
      lineUserId: 'mock_line_user_456',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const mockToken = 'mock_jwt_token_for_test'
    login({ user: mockUser, token: mockToken })
    console.log('別のモックユーザーでログイン:', mockUser)
  }

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Shield className="mr-2 h-5 w-5" />
          セキュリティ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2 text-foreground">ログアウト</h4>
          <p className="text-sm text-foreground/70 mb-3">
            デバイスからログアウトします。
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={logout}>
              ログアウト
            </Button>
            <Button variant="secondary" onClick={handleMockLogin} size="sm">
              別ユーザーで再ログイン（開発用）
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <h4 className="font-medium mb-2 text-destructive">危険な操作</h4>
          <p className="text-sm text-foreground/70 mb-3">
            アカウントを削除すると、すべてのデータが永久に失われます。
          </p>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            <Trash2 className="mr-2 h-4 w-4" />
            アカウントを削除
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SupportSection() {
  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <HelpCircle className="mr-2 h-5 w-5" />
          サポート
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2 text-foreground">ヘルプとサポート</h4>
          <p className="text-sm text-foreground/70 mb-3">
            使い方やトラブルシューティングについて
          </p>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            ヘルプページ
          </Button>
        </div>

        <div>
          <h4 className="font-medium mb-2 text-foreground">フィードバック</h4>
          <p className="text-sm text-foreground/70 mb-3">
            改善提案やバグ報告をお聞かせください
          </p>
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            フィードバック送信
          </Button>
        </div>

        <div className="pt-4 border-t border-border text-center text-sm text-foreground/60">
          <p>薬管理システム v1.0.0</p>
          <p>© 2024 Medication Reminder</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function Settings() {
  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">設定</h1>
        <p className="text-muted-foreground">アカウントとアプリケーションの設定</p>
      </div>

      {/* 設定セクション */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ProfileSection />
          <NotificationSection />
        </div>
        <div className="space-y-6">
          <AppearanceSection />
          <SecuritySection />
          <SupportSection />
        </div>
      </div>
    </div>
  )
}