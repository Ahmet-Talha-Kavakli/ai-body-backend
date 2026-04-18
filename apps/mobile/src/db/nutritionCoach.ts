import { openDatabaseSync } from 'expo-sqlite'
import type { CoachQuestion, CoachResponse, CoachContext } from '../types/nutrition-coach'

const db = openDatabaseSync('nutrition.db')

export async function createCoachTables(): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS coach_questions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      question TEXT NOT NULL,
      inputType TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      synced INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coach_responses (
      id TEXT PRIMARY KEY,
      questionId TEXT NOT NULL,
      response TEXT NOT NULL,
      context TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (questionId) REFERENCES coach_questions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_coach_questions_userId ON coach_questions(userId);
    CREATE INDEX IF NOT EXISTS idx_coach_responses_questionId ON coach_responses(questionId);
  `)
}

export async function saveCoachQuestion(question: CoachQuestion): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO coach_questions (id, userId, question, inputType, createdAt, synced)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      question.id,
      question.userId,
      question.question,
      question.inputType,
      question.createdAt,
      question.synced ? 1 : 0,
    ]
  )
}

export async function getCoachQuestion(id: string): Promise<CoachQuestion | null> {
  const result = await db.getFirstAsync<{
    id: string
    userId: string
    question: string
    inputType: 'text' | 'voice'
    createdAt: string
    synced: number
  }>(
    `SELECT id, userId, question, inputType, createdAt, synced FROM coach_questions WHERE id = ?`,
    [id]
  )

  if (!result) return null

  return {
    id: result.id,
    userId: result.userId,
    question: result.question,
    inputType: result.inputType,
    createdAt: result.createdAt,
    synced: result.synced === 1,
  }
}

export async function saveCoachResponse(response: CoachResponse): Promise<void> {
  const contextJson = JSON.stringify(response.context)
  await db.runAsync(
    `INSERT OR REPLACE INTO coach_responses (id, questionId, response, context)
     VALUES (?, ?, ?, ?)`,
    [response.id, response.questionId, response.response, contextJson]
  )
}

export async function getConversationHistory(
  userId: string
): Promise<(CoachQuestion & { response?: CoachResponse | null })[]> {
  const questions = await db.getAllAsync<{
    id: string
    userId: string
    question: string
    inputType: 'text' | 'voice'
    createdAt: string
    synced: number
  }>(
    `SELECT id, userId, question, inputType, createdAt, synced
     FROM coach_questions
     WHERE userId = ?
     ORDER BY createdAt DESC`,
    [userId]
  )

  const history: (CoachQuestion & { response?: CoachResponse | null })[] = []

  for (const q of questions) {
    const responseRow = await db.getFirstAsync<{
      id: string
      questionId: string
      response: string
      context: string
    }>(`SELECT id, questionId, response, context FROM coach_responses WHERE questionId = ?`, [q.id])

    const coachQuestion: CoachQuestion = {
      id: q.id,
      userId: q.userId,
      question: q.question,
      inputType: q.inputType,
      createdAt: q.createdAt,
      synced: q.synced === 1,
    }

    if (responseRow) {
      let context: CoachContext
      try {
        context = JSON.parse(responseRow.context)
      } catch {
        context = {
          recentMeals: [],
          todayIntake: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
          goals: null,
          streakData: { current: 0, longest: 0 },
        }
      }

      history.push({
        ...coachQuestion,
        response: {
          id: responseRow.id,
          questionId: responseRow.questionId,
          response: responseRow.response,
          context,
        },
      })
    } else {
      history.push(coachQuestion)
    }
  }

  return history
}
