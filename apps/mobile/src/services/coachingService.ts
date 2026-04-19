import { CoachingInsight } from '@/types/analytics'
import { analyticsClient } from './analyticsClient'
import Anthropic from '@anthropic-ai/sdk'

let anthropic: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    })
  }
  return anthropic
}

// For testing: export function to reset the singleton
export function __resetAnthropic(): void {
  anthropic = null
}

// Generate performance coaching insights
export async function generatePerformanceInsights(
  userId: string,
  data: any
): Promise<CoachingInsight[]> {
  try {
    const insights: CoachingInsight[] = []

    // Call Claude API for performance analysis
    const message = await getAnthropic().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this user's workout performance and provide 2-3 actionable coaching insights:

Total workouts: ${data.totalWorkouts}
Avg intensity: ${data.avgIntensity}/10
Favorite exercise: ${data.favoriteExercise}
Progress trend: ${data.progressTrend}
Last 7 days: ${JSON.stringify(data.last7Days)}

Format response as JSON array with objects: {insight: string, actionable: boolean, suggestedAction: string}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      try {
        const parsed = JSON.parse(content.text)
        for (const item of parsed) {
          insights.push({
            id: `insight-${Date.now()}-${Math.random()}`,
            userId,
            domain: 'performance',
            title: `Performance Tip`,
            insight: item.insight,
            data,
            actionable: item.actionable,
            suggestedAction: item.suggestedAction,
            createdAt: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error('Failed to parse Claude response:', e)
      }
    }
    return insights
  } catch (error) {
    console.error('Failed to generate performance insights:', error)
    return []
  }
}

// Generate nutrition coaching insights
export async function generateNutritionInsights(
  userId: string,
  data: any
): Promise<CoachingInsight[]> {
  try {
    const insights: CoachingInsight[] = []

    const message = await getAnthropic().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this user's nutrition and provide 2-3 actionable coaching insights:

Avg calories: ${data.avgCalories}
Avg protein: ${data.avgProtein}g
Meals logged: ${data.mealsLogged}
Consistency: ${data.consistencyScore}%
Favorite meals: ${data.favoriteMeals.join(', ')}

Format response as JSON array with objects: {insight: string, actionable: boolean, suggestedAction: string}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      try {
        const parsed = JSON.parse(content.text)
        for (const item of parsed) {
          insights.push({
            id: `insight-${Date.now()}-${Math.random()}`,
            userId,
            domain: 'nutrition',
            title: `Nutrition Tip`,
            insight: item.insight,
            data,
            actionable: item.actionable,
            suggestedAction: item.suggestedAction,
            createdAt: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error('Failed to parse Claude response:', e)
      }
    }
    return insights
  } catch (error) {
    console.error('Failed to generate nutrition insights:', error)
    return []
  }
}

// Generate recovery coaching insights
export async function generateRecoveryInsights(
  userId: string,
  data: any
): Promise<CoachingInsight[]> {
  try {
    const insights: CoachingInsight[] = []

    const message = await getAnthropic().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this user's recovery metrics and provide 2-3 actionable coaching insights:

Avg sleep: ${data.avgSleep} hours
Sleep quality: ${data.sleepQuality}/10
HRV trend: ${data.hrvTrend}
Recent overtraining risk: ${data.overtrainingRisk}

Format response as JSON array with objects: {insight: string, actionable: boolean, suggestedAction: string}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      try {
        const parsed = JSON.parse(content.text)
        for (const item of parsed) {
          insights.push({
            id: `insight-${Date.now()}-${Math.random()}`,
            userId,
            domain: 'recovery',
            title: `Recovery Tip`,
            insight: item.insight,
            data,
            actionable: item.actionable,
            suggestedAction: item.suggestedAction,
            createdAt: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error('Failed to parse Claude response:', e)
      }
    }
    return insights
  } catch (error) {
    console.error('Failed to generate recovery insights:', error)
    return []
  }
}

// Generate behavioral/motivation coaching insights
export async function generateBehavioralInsights(
  userId: string,
  data: any
): Promise<CoachingInsight[]> {
  try {
    const insights: CoachingInsight[] = []

    const message = await getAnthropic().messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze this user's behavior and motivation and provide 2-3 actionable coaching insights:

Current streak: ${data.currentStreak} days
Motivation level: ${data.motivationLevel}/10
Goal adherence: ${data.goalAdherence}%
Recent wins: ${data.recentWins.join(', ')}

Format response as JSON array with objects: {insight: string, actionable: boolean, suggestedAction: string}`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') {
      try {
        const parsed = JSON.parse(content.text)
        for (const item of parsed) {
          insights.push({
            id: `insight-${Date.now()}-${Math.random()}`,
            userId,
            domain: 'behavioral',
            title: `Motivation Tip`,
            insight: item.insight,
            data,
            actionable: item.actionable,
            suggestedAction: item.suggestedAction,
            createdAt: new Date().toISOString(),
          })
        }
      } catch (e) {
        console.error('Failed to parse Claude response:', e)
      }
    }
    return insights
  } catch (error) {
    console.error('Failed to generate behavioral insights:', error)
    return []
  }
}

// Generate all coaching insights (priority: performance, nutrition, recovery, behavioral)
export async function generateAllCoachingInsights(userId: string): Promise<CoachingInsight[]> {
  // Get analytics data for user
  // For now, return empty - will be populated from analyticsService
  return []
}
