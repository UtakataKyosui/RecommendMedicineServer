import React, { useState } from 'react'
import { format } from 'date-fns'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label
} from '@/components/ui'
import { 
  useMedicines, 
  useAppActions 
} from '@/store'
import type { MedicationLog, MedicationStatus } from '@/types'

interface QuickLogModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickLogModal({ isOpen, onClose }: QuickLogModalProps) {
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
            <Label htmlFor="medicine">薬名 *</Label>
            <select
              id="medicine"
              value={selectedMedicine}
              onChange={(e) => setSelectedMedicine(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
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
            <Label htmlFor="quickStatus">ステータス</Label>
            <select
              id="quickStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as MedicationStatus)}
              className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="completed">完了</option>
              <option value="missed">未服薬</option>
              <option value="skipped">スキップ</option>
            </select>
          </div>

          <div>
            <Label htmlFor="quickTakenTime">
              {status === 'completed' ? '服薬時刻' : '予定時刻'}
            </Label>
            <Input
              id="quickTakenTime"
              type="datetime-local"
              value={takenTime}
              onChange={(e) => setTakenTime(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="quickNotes">メモ</Label>
            <textarea
              id="quickNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
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