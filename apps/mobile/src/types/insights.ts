// Insights display types for home screen and analytics dashboard

// Insight Card - displayed on home screen
export interface InsightCard {
  id: string
  type: 'recommendation' | 'coaching' | 'achievement' | 'alert'
  title: string
  subtitle?: string
  action: string // "Try this meal", "Start this workout"
  icon: string
  priority: 'high' | 'medium' | 'low'
  expiresAt: string // ISO
}

// Analytics Chart Data - for charting library integration
export interface AnalyticsChartData {
  labels: string[] // dates or periods
  datasets: Array<{
    label: string
    data: number[]
    borderColor: string
    backgroundColor?: string
  }>
}

// Trend Data - metric trend information
export interface TrendData {
  metric: string
  current: number
  previous: number
  trend: 'up' | 'flat' | 'down'
  percentChange: number
}
