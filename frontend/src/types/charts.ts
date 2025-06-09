// Chart Data Types
export interface ChartDataPoint {
  date: string
  scheduled: number
  completed: number
  adherenceRate: number
}

export interface MedicineChartData {
  medicineName: string
  data: ChartDataPoint[]
}