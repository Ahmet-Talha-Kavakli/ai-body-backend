/**
 * Program Generation Service - Claude API Integration
 * Generates personalized coaching programs based on session performance and user analytics
 *
 * Features:
 * - Claude API integration for program generation
 * - 30-second timeout with fallback to stub program
 * - Exercise recommendations with form tips
 * - Nutrition and recovery guidance
 */

import Anthropic from '@anthropic-ai/sdk'
import type { CoachingProgram } from '../types/coaching'

// ==================== TYPES ====================

export interface ProgramGenerationInput {
  userId: string
  sessionId: string
  userAnalytics: {
    workoutHistory: string[]
    strengthLevels: Record<string, number>
  }
  formScores: {
    exercise: string
    score: number
  }[]
  coachNotes: string
}

export interface Exercise {
  name: string
  sets: number
  reps: number
  weight?: number
  formTips: string[]
  progression?: string
}

// ==================== STATE ====================

let anthropic: Anthropic | null = null

// ==================== INITIALIZATION ====================

/**
 * Get or create Anthropic client
 */
function getAnthropic(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
    })
  }
  return anthropic
}

/**
 * Reset Anthropic singleton for testing
 */
export function __resetAnthropic(): void {
  anthropic = null
}

// ==================== MAIN PROGRAM GENERATION ====================

/**
 * Generate personalized coaching program via Claude API
 */
export async function generateProgram(
  input: ProgramGenerationInput
): Promise<CoachingProgram> {
  try {
    // Build the prompt
    const prompt = buildClaudePrompt(input)

    // Get Claude instance
    const client = getAnthropic()

    // Create message with timeout
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Claude API timeout after 30 seconds'))
      }, 30000)
    })

    const messagePromise = client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    let message
    try {
      message = await Promise.race([messagePromise, timeoutPromise])
    } catch (timeoutError) {
      console.error('Claude API timeout:', timeoutError)
      return generateStubProgram(input)
    }

    // Extract text content
    const content = message.content[0]
    if (content.type !== 'text') {
      console.error('Unexpected response type from Claude')
      return generateStubProgram(input)
    }

    // Parse the response
    const program = parseCoachingProgram(
      content.text,
      input.userId,
      input.sessionId
    )

    return program
  } catch (error) {
    console.error('Error generating coaching program:', error)
    return generateStubProgram(input)
  }
}

// ==================== PROMPT BUILDING ====================

/**
 * Build Claude prompt with user data and form scores
 */
function buildClaudePrompt(input: ProgramGenerationInput): string {
  const { userAnalytics, formScores, coachNotes } = input

  // Calculate average form score
  const avgFormScore =
    formScores.length > 0
      ? Math.round(
          formScores.reduce((sum, f) => sum + f.score, 0) / formScores.length
        )
      : 0

  // Build exercises list from form scores
  const exercises = formScores.map((f) => f.exercise).join(', ') || 'general exercises'

  // Build workout history string
  const workoutHistory =
    userAnalytics.workoutHistory.length > 0
      ? `Previous workouts: ${userAnalytics.workoutHistory.join(', ')}`
      : 'New to structured training'

  // Build strength levels string
  const strengthLevels =
    Object.keys(userAnalytics.strengthLevels).length > 0
      ? `Strength levels: ${Object.entries(userAnalytics.strengthLevels)
          .map(([ex, weight]) => `${ex}: ${weight}lbs`)
          .join(', ')}`
      : 'Baseline strength assessment pending'

  return `Generate a personalized coaching program for a user based on their session performance.

User Context:
${workoutHistory}
${strengthLevels}

Session Performance:
- Average form score: ${avgFormScore}%
- Exercises performed: ${exercises}
- Coach notes: ${coachNotes || 'None'}

Based on this information, create a coaching program with the following JSON structure (ONLY valid JSON, no markdown or code blocks):

{
  "exercises": [
    {
      "name": "exercise name",
      "sets": 3,
      "reps": 8,
      "weight": 185,
      "formTips": ["tip 1", "tip 2"],
      "progression": "increase weight by 5lbs next session"
    }
  ],
  "nutritionNotes": "specific nutrition guidance",
  "recoveryTips": "recovery and rest recommendations",
  "nextSessionRecommendation": "focus areas for next session"
}

Ensure the exercises are:
1. Appropriate for user's current strength level
2. Focused on form improvement if average score < 75
3. Progressive if form is solid (> 85)
4. Include specific form tips based on the form score

Respond with ONLY the JSON object, no additional text.`
}

// ==================== RESPONSE PARSING ====================

/**
 * Parse Claude's JSON response into CoachingProgram
 */
function parseCoachingProgram(
  responseText: string,
  userId: string,
  sessionId: string
): CoachingProgram {
  try {
    // Clean up response (remove potential markdown code blocks)
    let cleanText = responseText.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    // Parse JSON
    const parsed = JSON.parse(cleanText)

    // Validate and construct program
    const program: CoachingProgram = {
      id: `program-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      coachId: 'claude-coach', // Stub coach ID
      sessionId,
      exercises: (parsed.exercises || []).map((ex: any) => ({
        name: ex.name || 'Unknown Exercise',
        sets: Math.max(1, parseInt(ex.sets) || 3),
        reps: Math.max(1, parseInt(ex.reps) || 8),
        weight: ex.weight ? parseInt(ex.weight) : undefined,
        formTips: Array.isArray(ex.formTips) ? ex.formTips : [],
        progression: ex.progression || undefined,
      })),
      nutritionNotes: parsed.nutritionNotes || undefined,
      recoveryTips: parsed.recoveryTips || undefined,
      nextSessionRecommendation: parsed.nextSessionRecommendation || undefined,
      createdAt: new Date().toISOString(),
    }

    return program
  } catch (error) {
    console.error('Error parsing Claude response:', error)
    return generateStubProgram({
      userId,
      sessionId,
      userAnalytics: { workoutHistory: [], strengthLevels: {} },
      formScores: [],
      coachNotes: '',
    })
  }
}

// ==================== STUB PROGRAM GENERATION ====================

/**
 * Generate stub program when Claude API fails or times out
 */
function generateStubProgram(input: ProgramGenerationInput): CoachingProgram {
  const { userId, sessionId } = input

  return {
    id: `program-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    coachId: 'claude-coach',
    sessionId,
    exercises: [
      {
        name: 'Squat',
        sets: 3,
        reps: 8,
        weight: 185,
        formTips: [
          'Keep chest up',
          'Knees track over toes',
          'Full depth with control',
        ],
        progression: 'Increase weight by 5lbs when form is solid',
      },
      {
        name: 'Deadlift',
        sets: 3,
        reps: 5,
        weight: 225,
        formTips: [
          'Neutral spine throughout',
          'Drive through heels',
          'Keep bar close to body',
        ],
        progression: 'Focus on form before adding weight',
      },
      {
        name: 'Bench Press',
        sets: 3,
        reps: 6,
        weight: 185,
        formTips: [
          'Shoulder blades retracted',
          'Full range of motion',
          'Controlled descent',
        ],
        progression: 'Add 2.5-5lbs when completing all sets comfortably',
      },
    ],
    nutritionNotes:
      'Coach feedback generated. Eat in a slight caloric surplus to support strength gains.',
    recoveryTips:
      'Coach feedback generated. Get 7-9 hours of sleep and take at least one rest day per week.',
    nextSessionRecommendation:
      'Coach feedback generated. Next session, focus on improving form consistency and building confidence with these movements.',
    createdAt: new Date().toISOString(),
  }
}
