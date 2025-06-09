import React from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Pill,
  TrendingUp,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui'
import { useTodayStats, useAppActions, usePendingMedications, useActiveMedicines, useLogs, useMedicines } from '@/store'
import type { MedicationStatus } from '@/types'
import { QuickLogModal } from '@/components/QuickLogModal'
import {useState} from "react"

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend 
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color?: 'blue' | 'green' | 'red' | 'yellow'
  trend?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  }

  return (
    <Card className="hover:shadow-2xl transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={`p-4 rounded-2xl ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-7 w-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TodayScheduleCard() {
  const pendingMedications = usePendingMedications()
  const medicines = useMedicines()
  const { openMedicationLogModal } = useAppActions()
  
  const getMedicine = (medicineId: number) => 
    medicines.find(m => m.id === medicineId)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          今日の服薬予定
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingMedications.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex items-center justify-center h-20 text-muted-foreground mb-4">
              <CheckCircle className="h-12 w-12" />
            </div>
            <p className="text-sm text-muted-foreground">
              予定されている服薬はありません
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              お疲れ様でした！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingMedications.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-elevated rounded-xl transition-all duration-200 cursor-pointer border-2 border-cute-pink/30 shadow-md hover:shadow-lg hover:border-cute-pink hover:shadow-cute-pink/20 hover:scale-105 active:scale-95 hover:bg-gradient-to-r hover:from-cute-pink/5 hover:to-cute-lavender/5"
                onClick={() => openMedicationLogModal(log)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-sm" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {getMedicine(log.medicineId)?.name || '薬名不明'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(log.scheduledTime), 'HH:mm', { locale: ja })}
                    </p>
                  </div>
                </div>
                <Badge variant="pending" className="shadow-sm">予定</Badge>
              </div>
            ))}
            {pendingMedications.length > 5 && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground bg-muted rounded-lg py-2 px-4 border-2 border-cute-pink/20">
                  他 {pendingMedications.length - 5} 件の予定があります
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  const { openAddMedicineModal } = useAppActions()
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={openAddMedicineModal}
            className="w-full justify-start"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            新しい薬を追加
          </Button>
          <Button 
            onClick={() => setIsQuickLogOpen(true)}
            className="w-full justify-start"
            variant="outline"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            服薬記録を追加
          </Button>
        </CardContent>
      </Card>
      
      <QuickLogModal isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} />
    </>
  )
}

function RecentActivity() {
  const logs = useLogs()
  const medicines = useMedicines()
  
  const getMedicine = (medicineId: number) => 
    medicines.find(m => m.id === medicineId)
  
  // 最近7日間の記録を取得
  const recentLogs = React.useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    return logs
      .filter(log => {
        const logDate = new Date(log.scheduledTime)
        return logDate >= sevenDaysAgo
      })
      .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
      .slice(0, 10)
  }, [logs])

  const getStatusIcon = (status: MedicationStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'missed':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: MedicationStatus) => {
    switch (status) {
      case 'completed': return '完了'
      case 'missed': return '未服薬'
      case 'skipped': return 'スキップ'
      case 'pending': return '予定'
      default: return '不明'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="mr-2 h-5 w-5" />
          最近の活動
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentLogs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">最近の活動はありません</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border-2 border-cute-pink/20 hover:border-cute-pink/40 transition-all duration-200">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium text-foreground">
                      {getMedicine(log.medicineId)?.name || '薬名不明'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.scheduledTime), 'MM/dd HH:mm', { locale: ja })}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={
                    log.status === 'completed' ? 'success' :
                    log.status === 'missed' ? 'destructive' :
                    log.status === 'skipped' ? 'warning' : 'pending'
                  }
                >
                  {getStatusText(log.status)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const todayStats = useTodayStats()
  const activeMedicines = useActiveMedicines()

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="relative">
        <div className="absolute -top-2 -left-2 w-20 h-20 bg-gradient-to-r from-cute-pink/20 to-cute-lavender/15 rounded-full blur-xl" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cute-pink to-cute-lavender bg-clip-text text-transparent relative z-10">
          ダッシュボード ✨
        </h1>
        <p className="text-muted-foreground relative z-10">今日の服薬状況と全体の概要 💊</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日の服薬率"
          value={`${todayStats.adherenceRate}%`}
          icon={TrendingUp}
          color={todayStats.adherenceRate >= 80 ? 'green' : todayStats.adherenceRate >= 60 ? 'yellow' : 'red'}
        />
        <StatCard
          title="完了した服薬"
          value={todayStats.completed}
          icon={CheckCircle}
          color="green"
          trend={`全${todayStats.total}回中`}
        />
        <StatCard
          title="未服薬"
          value={todayStats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="登録済み薬品"
          value={activeMedicines.length}
          icon={Pill}
          color="blue"
        />
      </div>

      {/* 今日の進捗 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            今日の進捗
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                服薬進捗: {todayStats.completed}/{todayStats.total}
              </span>
              <span className="text-sm font-medium text-foreground">
                {todayStats.adherenceRate}%
              </span>
            </div>
            <Progress value={todayStats.adherenceRate} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>完了: {todayStats.completed}</span>
              <span>予定: {todayStats.pending}</span>
              <span>未服薬: {todayStats.missed}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* メインコンテンツエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodayScheduleCard />
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}

