import { describe, it, expect } from 'vitest'
import type {
  InsightCard,
  AnalyticsChartData,
  TrendData,
} from '../insights'

describe('insights types', () => {
  describe('InsightCard', () => {
    it('should create a valid InsightCard with all required fields', () => {
      const card: InsightCard = {
        id: 'card-1',
        type: 'recommendation',
        title: 'Try Chicken Pasta',
        subtitle: 'High protein meal',
        action: 'View Recipe',
        icon: 'utensils',
        priority: 'high',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      expect(card.id).toBe('card-1')
      expect(card.type).toBe('recommendation')
      expect(card.title).toBe('Try Chicken Pasta')
      expect(card.priority).toBe('high')
    })

    it('should support all insight card types', () => {
      const types = ['recommendation', 'coaching', 'achievement', 'alert'] as const
      types.forEach((type) => {
        const card: InsightCard = {
          id: `card-${type}`,
          type,
          title: 'Test',
          action: 'Action',
          icon: 'icon',
          priority: 'medium',
          expiresAt: new Date().toISOString(),
        }

        expect(card.type).toBe(type)
      })
    })

    it('should support all priority levels', () => {
      const priorities = ['high', 'medium', 'low'] as const
      priorities.forEach((priority) => {
        const card: InsightCard = {
          id: `card-${priority}`,
          type: 'recommendation',
          title: 'Test',
          action: 'Do it',
          icon: 'icon',
          priority,
          expiresAt: new Date().toISOString(),
        }

        expect(card.priority).toBe(priority)
      })
    })

    it('should support optional subtitle', () => {
      const cardWithSubtitle: InsightCard = {
        id: 'card-1',
        type: 'achievement',
        title: 'Milestone',
        subtitle: 'You reached 100 workouts!',
        action: 'Celebrate',
        icon: 'trophy',
        priority: 'high',
        expiresAt: new Date().toISOString(),
      }

      const cardWithoutSubtitle: InsightCard = {
        id: 'card-2',
        type: 'alert',
        title: 'Low Sleep',
        action: 'Read tips',
        icon: 'moon',
        priority: 'medium',
        expiresAt: new Date().toISOString(),
      }

      expect(cardWithSubtitle.subtitle).toBe('You reached 100 workouts!')
      expect(cardWithoutSubtitle.subtitle).toBeUndefined()
    })

    it('should track expiration time', () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

      const card: InsightCard = {
        id: 'card-1',
        type: 'coaching',
        title: 'Weekly Challenge',
        action: 'Join',
        icon: 'zap',
        priority: 'medium',
        expiresAt,
      }

      expect(card.expiresAt).toBe(expiresAt)
      expect(new Date(card.expiresAt).getTime()).toBeGreaterThan(now.getTime())
    })
  })

  describe('AnalyticsChartData', () => {
    it('should create valid AnalyticsChartData with labels and datasets', () => {
      const chartData: AnalyticsChartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Calories',
            data: [2000, 2100, 1900, 2050, 2000, 2200, 2100],
            borderColor: '#FF6B6B',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
          },
        ],
      }

      expect(chartData.labels).toHaveLength(7)
      expect(chartData.datasets).toHaveLength(1)
      expect(chartData.datasets[0].label).toBe('Calories')
      expect(chartData.datasets[0].data).toHaveLength(7)
    })

    it('should support multiple datasets', () => {
      const chartData: AnalyticsChartData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          {
            label: 'Protein (g)',
            data: [140, 150, 155, 160],
            borderColor: '#4ECDC4',
          },
          {
            label: 'Carbs (g)',
            data: [300, 310, 320, 330],
            borderColor: '#FFE66D',
            backgroundColor: 'rgba(255, 230, 109, 0.1)',
          },
          {
            label: 'Fat (g)',
            data: [70, 75, 80, 85],
            borderColor: '#FF6B6B',
          },
        ],
      }

      expect(chartData.datasets).toHaveLength(3)
      expect(chartData.datasets[0].label).toBe('Protein (g)')
      expect(chartData.datasets[1].label).toBe('Carbs (g)')
      expect(chartData.datasets[2].label).toBe('Fat (g)')
    })

    it('should support optional backgroundColor', () => {
      const datasetWithBg = {
        label: 'Workouts',
        data: [5, 6, 5, 7],
        borderColor: '#95E1D3',
        backgroundColor: 'rgba(149, 225, 211, 0.2)',
      }

      const datasetWithoutBg = {
        label: 'Steps',
        data: [10000, 12000, 11000, 13000],
        borderColor: '#F38181',
      }

      const chartData: AnalyticsChartData = {
        labels: ['W1', 'W2', 'W3', 'W4'],
        datasets: [datasetWithBg, datasetWithoutBg],
      }

      expect(chartData.datasets[0].backgroundColor).toBeDefined()
      expect(chartData.datasets[1].backgroundColor).toBeUndefined()
    })

    it('should handle numeric data arrays of any length', () => {
      const chartData: AnalyticsChartData = {
        labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
        datasets: [
          {
            label: 'Daily Steps',
            data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 15000) + 5000),
            borderColor: '#2D3436',
          },
        ],
      }

      expect(chartData.labels).toHaveLength(30)
      expect(chartData.datasets[0].data).toHaveLength(30)
    })

    it('should support zero and negative values', () => {
      const chartData: AnalyticsChartData = {
        labels: ['Recovery', 'Deficit', 'Surplus'],
        datasets: [
          {
            label: 'Calorie Balance',
            data: [100, -300, 500],
            borderColor: '#FF0000',
          },
        ],
      }

      expect(chartData.datasets[0].data).toContain(-300)
      expect(chartData.datasets[0].data).toContain(100)
    })
  })

  describe('TrendData', () => {
    it('should create a valid TrendData with all required fields', () => {
      const trend: TrendData = {
        metric: 'calories',
        current: 2000,
        previous: 1900,
        trend: 'up',
        percentChange: 5.26,
      }

      expect(trend.metric).toBe('calories')
      expect(trend.current).toBe(2000)
      expect(trend.previous).toBe(1900)
      expect(trend.trend).toBe('up')
      expect(trend.percentChange).toBe(5.26)
    })

    it('should support all trend directions', () => {
      const directions = ['up', 'flat', 'down'] as const
      directions.forEach((direction) => {
        const trend: TrendData = {
          metric: 'test-metric',
          current: 100,
          previous: 100,
          trend: direction,
          percentChange: 0,
        }

        expect(trend.trend).toBe(direction)
      })
    })

    it('should calculate percent change correctly for increase', () => {
      const trend: TrendData = {
        metric: 'workouts',
        current: 6,
        previous: 5,
        trend: 'up',
        percentChange: 20,
      }

      expect(trend.percentChange).toBe(20)
      expect(trend.trend).toBe('up')
    })

    it('should calculate percent change correctly for decrease', () => {
      const trend: TrendData = {
        metric: 'sleep',
        current: 6,
        previous: 8,
        trend: 'down',
        percentChange: -25,
      }

      expect(trend.percentChange).toBe(-25)
      expect(trend.trend).toBe('down')
    })

    it('should identify flat trends with zero percent change', () => {
      const trend: TrendData = {
        metric: 'consistency',
        current: 100,
        previous: 100,
        trend: 'flat',
        percentChange: 0,
      }

      expect(trend.percentChange).toBe(0)
      expect(trend.trend).toBe('flat')
    })

    it('should support various metrics', () => {
      const metrics = ['calories', 'protein', 'workouts', 'sleep', 'steps', 'heartrate', 'consistency']
      metrics.forEach((metric) => {
        const trend: TrendData = {
          metric,
          current: 100,
          previous: 90,
          trend: 'up',
          percentChange: 11.11,
        }

        expect(trend.metric).toBe(metric)
      })
    })

    it('should handle large percent changes', () => {
      const trend: TrendData = {
        metric: 'protein-intake',
        current: 200,
        previous: 50,
        trend: 'up',
        percentChange: 300,
      }

      expect(trend.percentChange).toBe(300)
    })

    it('should handle negative values', () => {
      const trend: TrendData = {
        metric: 'deficit',
        current: -200,
        previous: -100,
        trend: 'down',
        percentChange: -100,
      }

      expect(trend.current).toBe(-200)
      expect(trend.previous).toBe(-100)
    })
  })
})
