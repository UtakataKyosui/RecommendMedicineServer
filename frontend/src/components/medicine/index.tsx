import React, { useState } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  Pill,
  Search
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
  useMedicines, 
  useAppActions, 
  useModals 
} from '@/store'
import type { Medicine, MedicineFormData } from '@/types'

interface MedicineCardProps {
  medicine: Medicine
  onEdit: (medicine: Medicine) => void
  onDelete: (id: number) => void
}

function MedicineCard({ medicine, onEdit, onDelete }: MedicineCardProps) {
  const scheduleCount = medicine.schedules?.length || 0
  const activeSchedules = medicine.schedules?.filter(s => s.active).length || 0

  return (
    <Card className={`transition-all hover:shadow-md ${!medicine.active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{medicine.name}</CardTitle>
              {medicine.description && (
                <p className="text-sm text-muted-foreground">{medicine.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={medicine.active ? 'default' : 'secondary'}>
              {medicine.active ? '有効' : '無効'}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(medicine)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(medicine.id)}
              className="text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {medicine.dosage && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="font-medium">用量:</span>
              <span className="ml-2">{medicine.dosage}{medicine.unit && ` ${medicine.unit}`}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>{activeSchedules}件のスケジュール</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              <span>総計{scheduleCount}件</span>
            </div>
          </div>

          {medicine.schedules && medicine.schedules.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">時間:</p>
              <div className="flex flex-wrap gap-1">
                {medicine.schedules
                  .filter(s => s.active)
                  .map((schedule, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {schedule.scheduledTime}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function MedicineModal() {
  const { addMedicine, updateMedicine, closeAddMedicineModal, closeEditMedicineModal } = useAppActions()
  const { addMedicine: isAddOpen, editMedicine } = useModals()
  const isOpen = isAddOpen || !!editMedicine
  const isEditing = !!editMedicine
  
  const [formData, setFormData] = useState<MedicineFormData>({
    name: '',
    description: '',
    dosage: '',
    unit: '',
    schedules: []
  })

  // フォームデータの初期化
  React.useEffect(() => {
    if (editMedicine) {
      setFormData({
        name: editMedicine.name,
        description: editMedicine.description || '',
        dosage: editMedicine.dosage || '',
        unit: editMedicine.unit || '',
        schedules: editMedicine.schedules?.map(s => ({
          scheduledTime: s.scheduledTime,
          frequency: s.frequency,
          daysOfWeek: s.daysOfWeek ? s.daysOfWeek.split(',').map(d => parseInt(d)) : []
        })) || []
      })
    } else {
      setFormData({
        name: '',
        description: '',
        dosage: '',
        unit: '',
        schedules: []
      })
    }
  }, [editMedicine])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isEditing && editMedicine) {
      // 編集の場合
      const updatedMedicine: Medicine = {
        ...editMedicine,
        name: formData.name,
        description: formData.description,
        dosage: formData.dosage,
        unit: formData.unit,
        schedules: formData.schedules.map((schedule, index) => ({
          id: editMedicine.schedules?.[index]?.id || Date.now() + index,
          medicineId: editMedicine.id,
          scheduledTime: schedule.scheduledTime,
          frequency: schedule.frequency,
          active: true,
          daysOfWeek: schedule.daysOfWeek.join(','),
          createdAt: editMedicine.schedules?.[index]?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        updatedAt: new Date().toISOString()
      }
      updateMedicine({ id: editMedicine.id, updates: updatedMedicine })
      closeEditMedicineModal()
    } else {
      // 新規追加の場合
      const newMedicine: Medicine = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        dosage: formData.dosage,
        unit: formData.unit,
        userId: 1,
        active: true,
        schedules: formData.schedules.map((schedule, index) => ({
          id: Date.now() + index,
          medicineId: Date.now(),
          scheduledTime: schedule.scheduledTime,
          frequency: schedule.frequency,
          active: true,
          daysOfWeek: schedule.daysOfWeek.join(','),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      addMedicine(newMedicine)
      closeAddMedicineModal()
    }
    
    setFormData({
      name: '',
      description: '',
      dosage: '',
      unit: '',
      schedules: []
    })
  }

  const addSchedule = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, {
        scheduledTime: '08:00',
        frequency: 'daily',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0]
      }]
    }))
  }

  const closeModal = () => {
    if (isEditing) {
      closeEditMedicineModal()
    } else {
      closeAddMedicineModal()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? '薬を編集' : '新しい薬を追加'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">薬名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="薬の名前を入力"
            />
          </div>
          
          <div>
            <Label htmlFor="description">説明</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="薬の説明"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dosage">用量</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="例: 1錠"
              />
            </div>
            <div>
              <Label htmlFor="unit">単位</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="例: 錠"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-foreground">服薬スケジュール</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                <Plus className="h-3 w-3 mr-1" />
                追加
              </Button>
            </div>
            {formData.schedules.map((schedule, index) => (
              <div key={index} className="p-3 border border-border rounded-lg mb-2 bg-surface/40">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-foreground">時間</Label>
                    <Input
                      type="time"
                      value={schedule.scheduledTime}
                      onChange={(e) => {
                        const newSchedules = [...formData.schedules]
                        newSchedules[index].scheduledTime = e.target.value
                        setFormData(prev => ({ ...prev, schedules: newSchedules }))
                      }}
                      className="bg-surface/60 border-border text-foreground"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSchedules = formData.schedules.filter((_, i) => i !== index)
                        setFormData(prev => ({ ...prev, schedules: newSchedules }))
                      }}
                      className="text-destructive"
                    >
                      削除
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              キャンセル
            </Button>
            <Button type="submit" disabled={!formData.name}>
              {isEditing ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function MedicineList() {
  const medicines = useMedicines()
  const { openAddMedicineModal, openEditMedicineModal, deleteMedicine } = useAppActions()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && medicine.active) || 
                         (filter === 'inactive' && !medicine.active)
    return matchesSearch && matchesFilter
  })

  const handleDelete = (id: number) => {
    if (confirm('この薬を削除しますか？関連する服薬記録も削除されます。')) {
      deleteMedicine(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">薬一覧</h1>
          <p className="text-muted-foreground">登録されている薬の管理</p>
        </div>
        <Button onClick={openAddMedicineModal}>
          <Plus className="mr-2 h-4 w-4" />
          薬を追加
        </Button>
      </div>

      {/* 検索・フィルター */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="薬名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
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
        </CardContent>
      </Card>

      {/* 薬一覧 */}
      {filteredMedicines.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || filter !== 'all' ? '条件に一致する薬が見つかりません' : '薬が登録されていません'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filter !== 'all' 
                ? '検索条件を変更してお試しください' 
                : '最初の薬を追加してください'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <Button onClick={openAddMedicineModal}>
                <Plus className="mr-2 h-4 w-4" />
                薬を追加
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onEdit={openEditMedicineModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* 統計 */}
      {medicines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>統計</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{medicines.length}</p>
                <p className="text-sm text-muted-foreground">総登録数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {medicines.filter(m => m.active).length}
                </p>
                <p className="text-sm text-muted-foreground">有効</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-muted-foreground">
                  {medicines.reduce((total, m) => total + (m.schedules?.filter(s => s.active).length || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">スケジュール数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <MedicineModal />
    </div>
  )
}