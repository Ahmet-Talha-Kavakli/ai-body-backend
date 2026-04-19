import { describe, it, expect } from 'vitest'
import type {
  UserEmbedding,
  Recommendation,
  CoachingInsight,
  AnalyticsSummary,
} from '../analytics'

describe('analytics types', () => {
  describe('UserEmbedding', () => {
    it('should create a valid UserEmbedding with all required fields', () => {
      const embedding: UserEmbedding = {
        userId: 'user-1',
        embedding: new Array(768).fill(0.1),
        mealPreferences: {
          cuisines: ['italian', 'asian'],
          ingredients: ['chicken', 'rice'],
          avgMacros: { protein: 30, carbs: 50, fat: 20 },
        },
        workoutPreferences: {
          favoriteExercises: ['squats', 'deadlifts'],
          avgIntensity: 7.5,
          frequency: 'daily',
        },
        healthPatterns: {
          avgSleep: 7.5,
          avgSteps: 10000,
          heartRateRange: [60, 100],
        },
        socialPatterns: {
          friendCount: 15,
          challengeParticipation: 5,
          badgeEarningRate: 2.5,
        },
        lastUpdated: new Date().toISOString(),
      }

      expect(embedding.userId).toBe('user-1')
      expect(embedding.embedding).toHaveLength(768)
      expect(embedding.mealPreferences.cuisines).toContain('italian')
      expect(embedding.workoutPreferences.avgIntensity).toBe(7.5)
      expect(embedding.healthPatterns.avgSleep).toBe(7.5)
      expect(embedding.socialPatterns.friendCount).toBe(15)
    })

    it('should support 768-dimensional embedding vector', () => {
      const embedding: UserEmbedding = {
        userId: 'user-1',
        embedding: new Array(768).fill(0),
        mealPreferences: {
          cuisines: [],
          ingredients: [],
          avgMacros: { protein: 0, carbs: 0, fat: 0 },
        },
        workoutPreferences: {
          favoriteExercises: [],
          avgIntensity: 0,
          frequency: 'weekly',
        },
        healthPatterns: {
          avgSleep: 0,
          avgSteps: 0,
          heartRateRange: [60, 100],
        },
        socialPatterns: {
          friendCount: 0,
          challengeParticipation: 0,
          badgeEarningRate: 0,
        },
        lastUpdated: new Date().toISOString(),
      }

      expect(embedding.embedding).toHaveLength(768)
    })

    it('should track meal preferences with multiple cuisines and ingredients', () => {
      const embedding: UserEmbedding = {
        userId: 'user-1',
        embedding: new Array(768).fill(0),
        mealPreferences: {
          cuisines: ['italian', 'asian', 'mexican'],
          ingredients: ['chicken', 'rice', 'tomato', 'basil'],
          avgMacros: { protein: 35, carbs: 45, fat: 20 },
        },
        workoutPreferences: {
          favoriteExercises: [],
          avgIntensity: 0,
          frequency: 'weekly',
        },
        healthPatterns: {
          avgSleep: 0,
          avgSteps: 0,
          heartRateRange: [60, 100],
        },
        socialPatterns: {
          friendCount: 0,
          challengeParticipation: 0,
          badgeEarningRate: 0,
        },
        lastUpdated: new Date().toISOString(),
      }

      expect(embedding.mealPreferences.cuisines).toHaveLength(3)
      expect(embedding.mealPreferences.ingredients).toHaveLength(4)
      expect(embedding.mealPreferences.avgMacros.protein).toBe(35)
    })

    it('should track workout preferences with favorite exercises', () => {
      const embedding: UserEmbedding = {
        userId: 'user-1',
        embedding: new Array(768).fill(0),
        mealPreferences: {
          cuisines: [],
          ingredients: [],
          avgMacros: { protein: 0, carbs: 0, fat: 0 },
        },
        workoutPreferences: {
          favoriteExercises: ['squats', 'bench press', 'deadlifts', 'rows'],
          avgIntensity: 8.2,
          frequency: 'daily',
        },
        healthPatterns: {
          avgSleep: 0,
          avgSteps: 0,
          heartRateRange: [60, 100],
        },
        socialPatterns: {
          friendCount: 0,
          challengeParticipation: 0,
          badgeEarningRate: 0,
        },
        lastUpdated: new Date().toISOString(),
      }

      expect(embedding.workoutPreferences.favoriteExercises).toHaveLength(4)
      expect(embedding.workoutPreferences.avgIntensity).toBe(8.2)
    })

    it('should track health patterns with sleep, steps, and heart rate', () => {
      const embedding: UserEmbedding = {
        userId: 'user-1',
        embedding: new Array(768).fill(0),
        mealPreferences: {
          cuisines: [],
          ingredients: [],
          avgMacros: { protein: 0, carbs: 0, fat: 0 },
        },
        workoutPreferences: {
          favoriteExercises: [],
          avgIntensity: 0,
          frequency: 'weekly',
        },
        healthPatterns: {
          avgSleep: 7.2,
          avgSteps: 12500,
          heartRateRange: [58, 102],
        },
        socialPatterns: {
          friendCount: 0,
          challengeParticipation: 0,
          badgeEarningRate: 0,
        },
        lastUpdated: new Date().toISOString(),
      }

      expect(embedding.healthPatterns.avgSleep).toBe(7.2)
      expect(embedding.healthPatterns.avgSteps).toBe(12500)
      expect(embedding.healthPatterns.heartRateRange[0]).toBe(58)
      expect(embedding.healthPatterns.heartRateRange[1]).toBe(102)
    })

    it('should track social patterns', () => {
      const embedding: UserEmbedding = {
        userId: 'user-1',
        embedding: new Array(768).fill(0),
        mealPreferences: {
          cuisines: [],
          ingredients: [],
          avgMacros: { protein: 0, carbs: 0, fat: 0 },
        },
        workoutPreferences: {
          favoriteExercises: [],
          avgIntensity: 0,
          frequency: 'weekly',
        },
        healthPatterns: {
          avgSleep: 0,
          avgSteps: 0,
          heartRateRange: [60, 100],
        },
        socialPatterns: {
          friendCount: 42,
          challengeParticipation: 8,
          badgeEarningRate: 3.5,
        },
        lastUpdated: new Date().toISOString(),
      }

      expect(embedding.socialPatterns.friendCount).toBe(42)
      expect(embedding.socialPatterns.challengeParticipation).toBe(8)
      expect(embedding.socialPatterns.badgeEarningRate).toBe(3.5)
    })
  })

  describe('Recommendation', () => {
    it('should create a valid Recommendation with all required fields', () => {
      const rec: Recommendation = {
        id: 'rec-1',
        userId: 'user-1',
        type: 'meal',
        title: 'Chicken Stir Fry',
        description: 'High protein, quick meal',
        confidence: 85,
        reasoning: 'Based on your meal history',
        actionUrl: 'app://meals/chicken-stir-fry',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      expect(rec.id).toBe('rec-1')
      expect(rec.userId).toBe('user-1')
      expect(rec.type).toBe('meal')
      expect(rec.confidence).toBe(85)
    })

    it('should support all recommendation types', () => {
      const types = ['meal', 'workout', 'health', 'friend', 'challenge', 'coaching'] as const
      types.forEach((type) => {
        const rec: Recommendation = {
          id: `rec-${type}`,
          userId: 'user-1',
          type,
          title: 'Test',
          description: 'Test recommendation',
          confidence: 75,
          reasoning: 'Test',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }

        expect(rec.type).toBe(type)
      })
    })

    it('should have confidence between 0 and 100', () => {
      const rec: Recommendation = {
        id: 'rec-1',
        userId: 'user-1',
        type: 'workout',
        title: 'Running',
        description: 'Daily run',
        confidence: 42,
        reasoning: 'Perfect for you',
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      }

      expect(rec.confidence).toBeGreaterThanOrEqual(0)
      expect(rec.confidence).toBeLessThanOrEqual(100)
    })

    it('should support optional actionUrl', () => {
      const recWithUrl: Recommendation = {
        id: 'rec-1',
        userId: 'user-1',
        type: 'meal',
        title: 'Test',
        description: 'Test',
        confidence: 80,
        reasoning: 'Test',
        actionUrl: 'app://action',
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      }

      const recWithoutUrl: Recommendation = {
        id: 'rec-2',
        userId: 'user-1',
        type: 'health',
        title: 'Test',
        description: 'Test',
        confidence: 60,
        reasoning: 'Test',
        createdAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      }

      expect(recWithUrl.actionUrl).toBe('app://action')
      expect(recWithoutUrl.actionUrl).toBeUndefined()
    })
  })

  describe('CoachingInsight', () => {
    it('should create a valid CoachingInsight with all required fields', () => {
      const insight: CoachingInsight = {
        id: 'insight-1',
        userId: 'user-1',
        domain: 'performance',
        title: 'Strength Progress',
        insight: 'Your squat has improved by 15% this month',
        data: { metric: 'squat', improvement: 15, unit: 'percent' },
        actionable: true,
        suggestedAction: 'Increase weight by 5-10%',
        createdAt: new Date().toISOString(),
      }

      expect(insight.id).toBe('insight-1')
      expect(insight.userId).toBe('user-1')
      expect(insight.domain).toBe('performance')
      expect(insight.actionable).toBe(true)
    })

    it('should support all coaching domains', () => {
      const domains = ['performance', 'nutrition', 'recovery', 'behavioral'] as const
      domains.forEach((domain) => {
        const insight: CoachingInsight = {
          id: `insight-${domain}`,
          userId: 'user-1',
          domain,
          title: 'Test',
          insight: 'Test insight',
          data: {},
          actionable: false,
          createdAt: new Date().toISOString(),
        }

        expect(insight.domain).toBe(domain)
      })
    })

    it('should support flexible data object', () => {
      const insight: CoachingInsight = {
        id: 'insight-1',
        userId: 'user-1',
        domain: 'nutrition',
        title: 'Macro Balance',
        insight: 'Your carb intake is high',
        data: {
          protein: 120,
          carbs: 300,
          fat: 80,
          date: '2024-01-15',
          percentages: { protein: 25, carbs: 50, fat: 25 },
        },
        actionable: true,
        suggestedAction: 'Increase protein',
        createdAt: new Date().toISOString(),
      }

      expect(insight.data.protein).toBe(120)
      expect(insight.data.percentages.carbs).toBe(50)
    })

    it('should support optional suggestedAction', () => {
      const insightWithAction: CoachingInsight = {
        id: 'insight-1',
        userId: 'user-1',
        domain: 'recovery',
        title: 'Sleep',
        insight: 'Low sleep detected',
        data: { avgSleep: 5.5 },
        actionable: true,
        suggestedAction: 'Get more rest',
        createdAt: new Date().toISOString(),
      }

      const insightWithoutAction: CoachingInsight = {
        id: 'insight-2',
        userId: 'user-1',
        domain: 'behavioral',
        title: 'Pattern',
        insight: 'Consistent behavior',
        data: {},
        actionable: false,
        createdAt: new Date().toISOString(),
      }

      expect(insightWithAction.suggestedAction).toBe('Get more rest')
      expect(insightWithoutAction.suggestedAction).toBeUndefined()
    })
  })

  describe('AnalyticsSummary', () => {
    it('should create a valid AnalyticsSummary with all required fields', () => {
      const summary: AnalyticsSummary = {
        userId: 'user-1',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 5,
          totalDuration: 300,
          avgIntensity: 7.5,
          favoriteExercise: 'squats',
          progressTrend: 'up',
        },
        nutritionStats: {
          avgCalories: 2000,
          avgProtein: 150,
          mealsLogged: 21,
          consistencyScore: 85,
          favoriteMeals: ['chicken rice', 'pasta', 'salad'],
        },
        healthStats: {
          avgSleep: 7.2,
          avgSteps: 10500,
          avgHeartRate: 72,
          sleepQuality: 7,
        },
        socialStats: {
          friends: 25,
          challengesCompleted: 3,
          badgesEarned: 2,
          totalPoints: 500,
        },
        goals: {
          calorieGoal: 2100,
          calorieActual: 2000,
          proteinGoal: 160,
          proteinActual: 150,
          workoutGoal: 5,
          workoutActual: 5,
          stepGoal: 70000,
          stepActual: 73500,
        },
      }

      expect(summary.userId).toBe('user-1')
      expect(summary.period).toBe('weekly')
      expect(summary.workoutStats.totalWorkouts).toBe(5)
      expect(summary.nutritionStats.mealsLogged).toBe(21)
      expect(summary.healthStats.avgSleep).toBe(7.2)
      expect(summary.socialStats.friends).toBe(25)
    })

    it('should support all period types', () => {
      const periods = ['daily', 'weekly', 'monthly'] as const
      periods.forEach((period) => {
        const summary: AnalyticsSummary = {
          userId: 'user-1',
          period,
          workoutStats: {
            totalWorkouts: 0,
            totalDuration: 0,
            avgIntensity: 0,
            favoriteExercise: '',
            progressTrend: 'flat',
          },
          nutritionStats: {
            avgCalories: 0,
            avgProtein: 0,
            mealsLogged: 0,
            consistencyScore: 0,
            favoriteMeals: [],
          },
          healthStats: {
            avgSleep: 0,
            avgSteps: 0,
            avgHeartRate: 0,
            sleepQuality: 0,
          },
          socialStats: {
            friends: 0,
            challengesCompleted: 0,
            badgesEarned: 0,
            totalPoints: 0,
          },
          goals: {
            calorieGoal: 0,
            calorieActual: 0,
            proteinGoal: 0,
            proteinActual: 0,
            workoutGoal: 0,
            workoutActual: 0,
            stepGoal: 0,
            stepActual: 0,
          },
        }

        expect(summary.period).toBe(period)
      })
    })

    it('should track all progress trends', () => {
      const trends = ['up', 'flat', 'down'] as const
      trends.forEach((trend) => {
        const summary: AnalyticsSummary = {
          userId: 'user-1',
          period: 'weekly',
          workoutStats: {
            totalWorkouts: 5,
            totalDuration: 300,
            avgIntensity: 7,
            favoriteExercise: 'bench',
            progressTrend: trend,
          },
          nutritionStats: {
            avgCalories: 2000,
            avgProtein: 150,
            mealsLogged: 21,
            consistencyScore: 80,
            favoriteMeals: [],
          },
          healthStats: {
            avgSleep: 7,
            avgSteps: 10000,
            avgHeartRate: 70,
            sleepQuality: 7,
          },
          socialStats: {
            friends: 20,
            challengesCompleted: 2,
            badgesEarned: 1,
            totalPoints: 400,
          },
          goals: {
            calorieGoal: 2100,
            calorieActual: 2000,
            proteinGoal: 160,
            proteinActual: 150,
            workoutGoal: 5,
            workoutActual: 5,
            stepGoal: 70000,
            stepActual: 70000,
          },
        }

        expect(summary.workoutStats.progressTrend).toBe(trend)
      })
    })

    it('should track comprehensive goal progress', () => {
      const summary: AnalyticsSummary = {
        userId: 'user-1',
        period: 'weekly',
        workoutStats: {
          totalWorkouts: 4,
          totalDuration: 250,
          avgIntensity: 6.5,
          favoriteExercise: 'running',
          progressTrend: 'flat',
        },
        nutritionStats: {
          avgCalories: 1900,
          avgProtein: 140,
          mealsLogged: 19,
          consistencyScore: 75,
          favoriteMeals: ['pasta', 'salad'],
        },
        healthStats: {
          avgSleep: 6.8,
          avgSteps: 9500,
          avgHeartRate: 75,
          sleepQuality: 6,
        },
        socialStats: {
          friends: 18,
          challengesCompleted: 1,
          badgesEarned: 0,
          totalPoints: 300,
        },
        goals: {
          calorieGoal: 2100,
          calorieActual: 1900,
          proteinGoal: 160,
          proteinActual: 140,
          workoutGoal: 5,
          workoutActual: 4,
          stepGoal: 70000,
          stepActual: 66500,
        },
      }

      expect(summary.goals.calorieActual).toBeLessThan(summary.goals.calorieGoal)
      expect(summary.goals.stepActual).toBeLessThan(summary.goals.stepGoal)
    })
  })
})
