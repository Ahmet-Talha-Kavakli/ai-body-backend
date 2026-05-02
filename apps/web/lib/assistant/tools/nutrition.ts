/**
 * Beslenme tool'ları.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const nutritionToolDefs: ToolDefinition[] = [
  {
    name: 'add_meal',
    category: 'nutrition',
    description:
      'Hızlı yemek kaydı ekler (kalori, protein vb.). Kullanıcı "1 muffin yedim" derse AI tahmin eder.',
    parameters: {
      type: 'object',
      properties: {
        mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
        name: { type: 'string', description: 'Yemek adı' },
        calories: { type: 'number' },
        protein: { type: 'number', description: 'gram' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
        fiber: { type: 'number' },
      },
      required: ['mealType', 'name', 'calories'],
    },
  },
  {
    name: 'get_today_macros',
    category: 'nutrition',
    description:
      'Bugünün toplam kalori, protein, karbonhidrat, yağ değerlerini döner. Hedefle birlikte.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_meal_history',
    category: 'nutrition',
    description: 'Son N günün öğün geçmişini döner.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 3 } },
    },
  },
  {
    name: 'set_macro_goal',
    category: 'nutrition',
    description: 'Günlük makro hedeflerini günceller.',
    parameters: {
      type: 'object',
      properties: {
        calories: { type: 'number' },
        protein: { type: 'number' },
        carbs: { type: 'number' },
        fat: { type: 'number' },
      },
      required: ['calories'],
    },
  },
]

export const nutritionExecutors: Record<string, ToolExecutor> = {
  add_meal: {
    name: 'add_meal',
    execute: async ({ userId, params }) => {
      const p = params as {
        mealType: string
        name: string
        calories: number
        protein?: number
        carbs?: number
        fat?: number
        fiber?: number
      }
      const meal = await db.mealLog.create({
        data: {
          userId,
          mealType: p.mealType,
          loggedAt: new Date(),
          source: 'ai',
          aiAnalyzed: true,
          items: [
            {
              name: p.name,
              servingSize: 1,
              servingUnit: 'porsiyon',
              quantity: 1,
              calories: p.calories,
              protein: p.protein ?? 0,
              carbs: p.carbs ?? 0,
              fat: p.fat ?? 0,
              fiber: p.fiber ?? 0,
              source: 'ai',
            },
          ],
          totalCalories: p.calories,
          totalProteinG: p.protein ?? 0,
          totalCarbsG: p.carbs ?? 0,
          totalFatG: p.fat ?? 0,
          totalFiberG: p.fiber ?? 0,
        },
      })
      return {
        ok: true,
        data: { mealId: meal.id },
        display: {
          title: `${p.name} eklendi`,
          subtitle: `${Math.round(p.calories)} kcal${p.protein ? ` • ${Math.round(p.protein)}g protein` : ''}`,
          icon: 'fork.knife',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },
  get_today_macros: {
    name: 'get_today_macros',
    execute: async ({ userId }) => {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const [meals, dietProfile] = await Promise.all([
        db.mealLog.findMany({
          where: { userId, loggedAt: { gte: todayStart } },
          select: {
            mealType: true,
            totalCalories: true,
            totalProteinG: true,
            totalCarbsG: true,
            totalFatG: true,
            totalFiberG: true,
          },
        }),
        db.nutritionGoal.findUnique({ where: { userId } }).catch(() => null),
      ])
      const total = meals.reduce(
        (s, m) => ({
          calories: s.calories + (m.totalCalories ?? 0),
          protein: s.protein + (m.totalProteinG ?? 0),
          carbs: s.carbs + (m.totalCarbsG ?? 0),
          fat: s.fat + (m.totalFatG ?? 0),
          fiber: s.fiber + (m.totalFiberG ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
      )
      return {
        ok: true,
        data: {
          today: {
            calories: Math.round(total.calories),
            protein: Math.round(total.protein),
            carbs: Math.round(total.carbs),
            fat: Math.round(total.fat),
            fiber: Math.round(total.fiber),
            mealCount: meals.length,
          },
          goal: dietProfile
            ? {
                calories: dietProfile.dailyCalories,
                protein: dietProfile.proteinG,
                carbs: dietProfile.carbsG,
                fat: dietProfile.fatG,
              }
            : null,
        },
      } satisfies ToolResult
    },
  },
  get_meal_history: {
    name: 'get_meal_history',
    execute: async ({ userId, params }) => {
      const { days = 3 } = (params as { days?: number }) ?? {}
      const since = new Date()
      since.setDate(since.getDate() - days)
      since.setHours(0, 0, 0, 0)
      const meals = await db.mealLog.findMany({
        where: { userId, loggedAt: { gte: since } },
        orderBy: { loggedAt: 'desc' },
        select: {
          loggedAt: true,
          mealType: true,
          totalCalories: true,
          totalProteinG: true,
          items: true,
        },
        take: 30,
      })
      const formatted = meals.map((m) => {
        const items = (m.items as Array<{ name: string }>).map((i) => i.name).filter(Boolean)
        return {
          date: m.loggedAt.toISOString().slice(0, 10),
          time: m.loggedAt.toISOString().slice(11, 16),
          mealType: m.mealType,
          calories: Math.round(m.totalCalories ?? 0),
          protein: Math.round(m.totalProteinG ?? 0),
          items,
        }
      })
      return { ok: true, data: { meals: formatted } } satisfies ToolResult
    },
  },
  set_macro_goal: {
    name: 'set_macro_goal',
    execute: async ({ userId, params }) => {
      const p = params as { calories: number; protein?: number; carbs?: number; fat?: number }
      const profile = await db.nutritionGoal.upsert({
        where: { userId },
        update: {
          dailyCalories: p.calories,
          proteinG: p.protein,
          carbsG: p.carbs,
          fatG: p.fat,
        },
        create: {
          userId,
          dailyCalories: p.calories,
          proteinG: p.protein ?? Math.round((p.calories * 0.25) / 4),
          carbsG: p.carbs ?? Math.round((p.calories * 0.45) / 4),
          fatG: p.fat ?? Math.round((p.calories * 0.3) / 9),
        },
      })
      return {
        ok: true,
        data: profile,
        display: {
          title: 'Makro hedefi güncellendi',
          subtitle: `${p.calories} kcal/gün`,
          icon: 'target',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },
}
