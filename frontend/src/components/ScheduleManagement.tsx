import React, { useState } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Calendar,
  Clock,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
  Filter
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge, 
  Label
} from '@/components/ui'
import { 
  useMedicines, 
  useLogs, 
  useAppActions, 
} from '@/store'
import type { MedicationSchedule, Medicine, MedicationLog, MedicationStatus } from '@/types'

interface ScheduleItemProps {
  schedule: MedicationSchedule
  medicine: Medicine
  logs: MedicationLog[]
  onEdit: () => void
  onDelete: () => void
}

function ScheduleItem({ schedule, medicine, logs, onEdit, onDelete }: ScheduleItemProps) {
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = logs.filter(log => 
    log.medicineId === medicine.id && 
    log.scheduledTime.startsWith(today) &&
    log.scheduledTime.includes(schedule.scheduledTime)
  )
  
  const todayLog = todayLogs[0]
  const status = todayLog?.status || 'pending'

  const getStatusColor = (status: MedicationStatus) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30'
      case 'missed': return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'
      case 'skipped': return 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30'
      case 'pending': return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const getStatusIcon = (status: MedicationStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'missed': return <AlertCircle className="h-4 w-4" />
      case 'skipped': return <AlertCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getDaysOfWeekText = (daysOfWeek?: string) => {
    if (!daysOfWeek) return '毎日'
    const days = daysOfWeek.split(',').map(d => parseInt(d))
    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    return days.map(d => dayNames[d]).join('、')
  }

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-foreground">{medicine.name}</h3>
                <Badge variant={schedule.active ? 'default' : 'secondary'}>
                  {schedule.active ? '有効' : '無効'}
                </Badge>
              </div>
              
              <div className="text-sm text-foreground/70 space-y-1">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{schedule.scheduledTime}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{getDaysOfWeekText(schedule.daysOfWeek)}</span>
                  </div>
                </div>
                
                {medicine.dosage && (
                  <p className="text-xs text-foreground/60">
                    用量: {medicine.dosage}{medicine.unit && ` ${medicine.unit}`}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WeekView() {
  const medicines = useMedicines()
  const logs = useLogs()
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const weekStart = startOfWeek(currentDate, { locale: ja })
  const weekEnd = endOfWeek(currentDate, { locale: ja })
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getSchedulesForDay = (date: Date) => {
    const dayOfWeek = date.getDay()
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const schedules: Array<{
      schedule: MedicationSchedule
      medicine: Medicine
      log?: MedicationLog
    }> = []

    medicines.forEach(medicine => {
      medicine.schedules?.forEach(schedule => {
        if (!schedule.active) return
        
        const scheduleDays = schedule.daysOfWeek ? 
          schedule.daysOfWeek.split(',').map(d => parseInt(d)) : 
          [0, 1, 2, 3, 4, 5, 6]
        
        if (scheduleDays.includes(dayOfWeek)) {
          const scheduledTime = `${dateStr}T${schedule.scheduledTime}:00`
          const log = logs.find(l => 
            l.medicineId === medicine.id && 
            l.scheduledTime === scheduledTime
          )
          
          schedules.push({ schedule, medicine, log })
        }
      })
    })

    return schedules.sort((a, b) => 
      a.schedule.scheduledTime.localeCompare(b.schedule.scheduledTime)
    )
  }

  const goToPreviousWeek = () => {
    setCurrentDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000))
  }

  const goToNextWeek = () => {
    setCurrentDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-foreground">
            <Calendar className="mr-2 h-5 w-5" />
            週間スケジュール
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              ← 前の週
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              今日
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              次の週 →
            </Button>
          </div>
        </div>
        <p className="text-sm text-foreground/70">
          {format(weekStart, 'yyyy年MM月dd日', { locale: ja })} - {format(weekEnd, 'MM月dd日', { locale: ja })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {daysInWeek.map((date, index) => {
            const schedules = getSchedulesForDay(date)
            const isToday = isSameDay(date, new Date())
            
            return (
              <div key={index} className={`p-3 rounded-lg border backdrop-blur-sm ${isToday ? 'bg-primary/10 border-primary/20' : 'bg-surface/60 border-border'}`}>
                <div className="text-center mb-3">
                  <p className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-foreground/70'}`}>
                    {format(date, 'E', { locale: ja })}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-blue-900' : 'text-foreground'}`}>
                    {format(date, 'd')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  {schedules.length === 0 ? (
                    <p className="text-xs text-foreground/60 text-center">予定なし</p>
                  ) : (
                    schedules.map((item, scheduleIndex) => {
                      const status = item.log?.status || 'pending'
                      const statusColors = {
                        completed: 'bg-green-100 text-green-800 border-green-200',
                        missed: 'bg-red-100 text-red-800 border-red-200',
                        skipped: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        pending: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600'
                      }
                      
                      return (
                        <div 
                          key={scheduleIndex}
                          className={`p-2 rounded text-xs border ${statusColors[status]}`}
                        >
                          <p className="font-medium truncate">{item.medicine.name}</p>
                          <p>{item.schedule.scheduledTime}</p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ScheduleManagement() {
  const medicines = useMedicines()
  const logs = useLogs()
  const [view, setView] = useState<'list' | 'week'>('list')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [medicineFilter, setMedicineFilter] = useState<number | 'all'>('all')

  // 全てのスケジュールを平坦化
  const allSchedules = medicines.flatMap(medicine => 
    medicine.schedules?.map(schedule => ({ schedule, medicine })) || []
  )

  const filteredSchedules = allSchedules.filter(({ schedule, medicine }) => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && schedule.active) || 
                         (filter === 'inactive' && !schedule.active)
    const matchesMedicine = medicineFilter === 'all' || medicine.id === medicineFilter
    return matchesFilter && matchesMedicine
  })

  const handleDeleteSchedule = (medicineId: number, scheduleId: number) => {
    if (confirm('このスケジュールを削除しますか？')) {
      // TODO: スケジュール削除API呼び出し
      console.log('Delete schedule:', scheduleId)
    }
  }

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayLogs = logs.filter(log => log.scheduledTime.startsWith(today))
    
    return {
      total: todayLogs.length,
      completed: todayLogs.filter(l => l.status === 'completed').length,
      pending: todayLogs.filter(l => l.status === 'pending').length,
      missed: todayLogs.filter(l => l.status === 'missed').length
    }
  }

  const stats = getTodayStats()

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">スケジュール管理</h1>
          <p className="text-foreground/70">服薬スケジュールの確認と管理</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
          >
            リスト表示
          </Button>
          <Button 
            variant={view === 'week' ? 'default' : 'outline'}
            onClick={() => setView('week')}
          >
            週間表示
          </Button>
        </div>
      </div>

      {/* 今日の統計 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-lg border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-foreground/70">今日の予定</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-lg border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-foreground/70">完了</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-lg border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
            <p className="text-sm text-foreground/70">予定</p>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-lg border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
            <p className="text-sm text-foreground/70">未服薬</p>
          </CardContent>
        </Card>
      </div>

      {view === 'week' ? (
        <WeekView />
      ) : (
        <>
          {/* フィルター */}
          <Card className="bg-card/80 backdrop-blur-lg border-border">
            <CardHeader>
              <CardTitle className="flex items-center text-foreground">
                <Filter className="mr-2 h-5 w-5" />
                フィルター
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-foreground">ステータス</Label>
                  <div className="flex gap-2 mt-1">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilter('all')}
                      size="sm"
                    >
                      すべて
                    </Button>
                    <Button
                      variant={filter === 'active' ? 'default' : 'outline'}
                      onClick={() => setFilter('active')}
                      size="sm"
                    >
                      有効
                    </Button>
                    <Button
                      variant={filter === 'inactive' ? 'default' : 'outline'}
                      onClick={() => setFilter('inactive')}
                      size="sm"
                    >
                      無効
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="medicineFilter" className="text-foreground">薬</Label>
                  <select
                    id="medicineFilter"
                    value={medicineFilter}
                    onChange={(e) => setMedicineFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-surface/60 text-foreground backdrop-blur-sm"
                  >
                    <option value="all">すべて</option>
                    {medicines.map(medicine => (
                      <option key={medicine.id} value={medicine.id}>
                        {medicine.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* スケジュール一覧 */}
          {filteredSchedules.length === 0 ? (
            <Card className="bg-card/80 backdrop-blur-lg border-border">
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  スケジュールが見つかりません
                </h3>
                <p className="text-foreground/70">
                  薬を追加してスケジュールを設定してください
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map(({ schedule, medicine }) => (
                <ScheduleItem
                  key={`${medicine.id}-${schedule.id}`}
                  schedule={schedule}
                  medicine={medicine}
                  logs={logs}
                  onEdit={() => {
                    // TODO: スケジュール編集モーダルを開く
                    console.log('Edit schedule:', schedule.id)
                  }}
                  onDelete={() => handleDeleteSchedule(medicine.id, schedule.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}