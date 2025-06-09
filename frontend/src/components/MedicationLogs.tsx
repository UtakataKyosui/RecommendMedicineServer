import React, { useState } from 'react'
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pill,
  Filter,
  Download,
  Plus,
  Edit
} from 'lucide-react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge, 
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label
} from '@/components/ui'
import { 
  useLogs, 
  useMedicines, 
  useAppActions, 
  useModals 
} from '@/store'
import type { MedicationLog, MedicationStatus } from '@/types'

interface LogItemProps {
  log: MedicationLog
  onEdit: (log: MedicationLog) => void
}

function LogItem({ log, onEdit }: LogItemProps) {
  const getStatusIcon = (status: MedicationStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: MedicationStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">完了</Badge>
      case 'missed':
        return <Badge variant="destructive">未服薬</Badge>
      case 'skipped':
        return <Badge variant="warning">スキップ</Badge>
      case 'pending':
        return <Badge variant="pending">予定</Badge>
      default:
        return <Badge variant="outline">不明</Badge>
    }
  }

  const scheduledTime = parseISO(log.scheduledTime)
  const takenTime = log.takenTime ? parseISO(log.takenTime) : null

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border hover:shadow-lg hover:shadow-black/5 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-primary/20">
              {getStatusIcon(log.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-foreground">
                  {log.medicine?.name || '薬名不明'}
                </h3>
                {getStatusBadge(log.status)}
              </div>
              <div className="text-sm text-foreground/70 space-y-1">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>予定: {format(scheduledTime, 'MM/dd HH:mm', { locale: ja })}</span>
                </div>
                {takenTime && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>実際: {format(takenTime, 'MM/dd HH:mm', { locale: ja })}</span>
                  </div>
                )}
                {log.notes && (
                  <p className="text-xs text-foreground/60 mt-1">{log.notes}</p>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(log)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function LogModal() {
  const { medicationLog: log } = useModals()
  const { closeMedicationLogModal, updateLog } = useAppActions()
  const [status, setStatus] = useState<MedicationStatus>(log?.status || 'pending')
  const [notes, setNotes] = useState(log?.notes || '')
  const [takenTime, setTakenTime] = useState(
    log?.takenTime ? format(parseISO(log.takenTime), "yyyy-MM-dd'T'HH:mm") : ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!log) return

    updateLog({ 
      id: log.id, 
      updates: {
        status,
        notes,
        takenTime: takenTime ? new Date(takenTime).toISOString() : undefined
      }
    })
    closeMedicationLogModal()
  }

  if (!log) return null

  return (
    <Dialog open={!!log} onOpenChange={closeMedicationLogModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>服薬記録を編集</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-foreground">薬名</Label>
            <p className="text-sm text-foreground/70">{log.medicine?.name || '薬名不明'}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground">予定時刻</Label>
            <p className="text-sm text-foreground/70">
              {format(parseISO(log.scheduledTime), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
            </p>
          </div>

          <div>
            <Label htmlFor="status" className="text-foreground">ステータス</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationStatus)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-surface/60 text-foreground backdrop-blur-sm"
            >
              <option value="pending">予定</option>
              <option value="completed">完了</option>
              <option value="missed">未服薬</option>
              <option value="skipped">スキップ</option>
            </select>
          </div>

          {status === 'completed' && (
            <div>
              <Label htmlFor="takenTime" className="text-foreground">実際の服薬時刻</Label>
              <Input
                id="takenTime"
                type="datetime-local"
                value={takenTime}
                onChange={(e) => setTakenTime(e.target.value)}
                className="mt-1 bg-surface/60 border-border text-foreground"
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="text-foreground">メモ</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-surface/60 text-foreground backdrop-blur-sm"
              placeholder="メモがあれば入力してください"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeMedicationLogModal}>
              キャンセル
            </Button>
            <Button type="submit">
              保存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function QuickLogModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const medicines = useMedicines()
  const { addLog } = useAppActions()
  const [selectedMedicine, setSelectedMedicine] = useState<number | ''>('')
  const [status, setStatus] = useState<MedicationStatus>('completed')
  const [takenTime, setTakenTime] = useState(() => {
    const now = new Date()
    return format(now, "yyyy-MM-dd'T'HH:mm")
  })
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMedicine) return

    const newLog: MedicationLog = {
      id: Date.now(),
      medicineId: Number(selectedMedicine),
      scheduledTime: new Date(takenTime).toISOString(),
      takenTime: status === 'completed' ? new Date(takenTime).toISOString() : undefined,
      status,
      notes,
      medicine: medicines.find(m => m.id === Number(selectedMedicine)),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    addLog(newLog)
    onClose()
    
    // フォームリセット
    setSelectedMedicine('')
    setStatus('completed')
    setTakenTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    setNotes('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>服薬記録を追加</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="medicine" className="text-foreground">薬名 *</Label>
            <select
              id="medicine"
              value={selectedMedicine}
              onChange={(e) => setSelectedMedicine(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-surface/60 text-foreground backdrop-blur-sm"
              required
            >
              <option value="">薬を選択してください</option>
              {medicines.filter(m => m.active).map(medicine => (
                <option key={medicine.id} value={medicine.id}>
                  {medicine.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="quickStatus" className="text-foreground">ステータス</Label>
            <select
              id="quickStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationStatus)}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-surface/60 text-foreground backdrop-blur-sm"
            >
              <option value="completed">完了</option>
              <option value="missed">未服薬</option>
              <option value="skipped">スキップ</option>
            </select>
          </div>

          <div>
            <Label htmlFor="quickTakenTime" className="text-foreground">
              {status === 'completed' ? '服薬時刻' : '予定時刻'}
            </Label>
            <Input
              id="quickTakenTime"
              type="datetime-local"
              value={takenTime}
              onChange={(e) => setTakenTime(e.target.value)}
              className="mt-1 bg-surface/60 border-border text-foreground"
              required
            />
          </div>

          <div>
            <Label htmlFor="quickNotes" className="text-foreground">メモ</Label>
            <textarea
              id="quickNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-surface/60 text-foreground backdrop-blur-sm"
              placeholder="メモがあれば入力してください"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={!selectedMedicine}>
              記録を追加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MedicationLogs() {
  const logs = useLogs()
  const medicines = useMedicines()
  const { openMedicationLogModal } = useAppActions()
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<MedicationStatus | 'all'>('all')
  const [medicineFilter, setMedicineFilter] = useState<number | 'all'>('all')
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false)

  const filteredLogs = logs.filter(log => {
    const logDate = parseISO(log.scheduledTime)
    
    const matchesDate = !dateFilter || 
      isWithinInterval(logDate, {
        start: startOfDay(parseISO(dateFilter)),
        end: endOfDay(parseISO(dateFilter))
      })
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter
    const matchesMedicine = medicineFilter === 'all' || log.medicineId === medicineFilter

    return matchesDate && matchesStatus && matchesMedicine
  }).sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())

  const getStats = () => {
    const total = filteredLogs.length
    const completed = filteredLogs.filter(l => l.status === 'completed').length
    const missed = filteredLogs.filter(l => l.status === 'missed').length
    const pending = filteredLogs.filter(l => l.status === 'pending').length
    const skipped = filteredLogs.filter(l => l.status === 'skipped').length

    return { total, completed, missed, pending, skipped }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">服薬記録</h1>
          <p className="text-muted-foreground">服薬履歴の確認と編集</p>
        </div>
        <Button 
          onClick={() => setIsQuickLogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          記録を追加
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card/80 backdrop-blur-lg border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-foreground/70">総記録数</p>
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
            <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
            <p className="text-sm text-foreground/70">未服薬</p>
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
            <p className="text-2xl font-bold text-yellow-600">{stats.skipped}</p>
            <p className="text-sm text-foreground/70">スキップ</p>
          </CardContent>
        </Card>
      </div>

      {/* フィルター */}
      <Card className="bg-card/80 backdrop-blur-lg border-border">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Filter className="mr-2 h-5 w-5" />
            フィルター
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFilter" className="text-foreground">日付</Label>
              <Input
                id="dateFilter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-1 bg-surface/60 border-border text-foreground"
              />
            </div>
            
            <div>
              <Label htmlFor="statusFilter" className="text-foreground">ステータス</Label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MedicationStatus | 'all')}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring bg-surface/60 text-foreground backdrop-blur-sm"
              >
                <option value="all">すべて</option>
                <option value="completed">完了</option>
                <option value="missed">未服薬</option>
                <option value="pending">予定</option>
                <option value="skipped">スキップ</option>
              </select>
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
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setDateFilter('')
                setStatusFilter('all')
                setMedicineFilter('all')
              }}
            >
              フィルターをクリア
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              エクスポート
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 記録一覧 */}
      {filteredLogs.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-lg border-border">
          <CardContent className="text-center py-12">
            <Pill className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              記録が見つかりません
            </h3>
            <p className="text-foreground/70">
              フィルター条件を変更するか、新しい服薬記録を追加してください
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <LogItem
              key={log.id}
              log={log}
              onEdit={openMedicationLogModal}
            />
          ))}
        </div>
      )}

      <LogModal />
      <QuickLogModal isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} />
    </div>
  )
}