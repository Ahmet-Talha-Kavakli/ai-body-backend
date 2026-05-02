/**
 * Spor & Fitness tool'ları (V2 Faz N).
 * WorkoutPlan, TrainingSession, ExerciseSet, PersonalRecord, Race, GearItem.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

const C = 'sports' as const

// 1RM tahmini (Epley formülü)
function epley1RM(weight: number, reps: number): number {
  if (reps <= 0) return weight
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export const sportsToolDefs: ToolDefinition[] = [
  // PLAN
  {
    name: 'create_workout_plan',
    category: C,
    description:
      'Antrenman planı oluştur. "PPL split", "Strength + cardio", "Push/Pull/Legs 6 hafta".',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: {
          type: 'string',
          enum: ['strength', 'hypertrophy', 'endurance', 'mixed', 'sport_specific'],
        },
        daysPerWeek: { type: 'number', default: 4 },
        durationWeeks: { type: 'number' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_workout_plans',
    category: C,
    description: 'Antrenman planlarını listele.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'paused', 'completed', 'archived'] },
      },
    },
  },
  {
    name: 'archive_workout_plan',
    category: C,
    description: 'Plan arşivle.',
    parameters: {
      type: 'object',
      properties: { planId: { type: 'string' } },
      required: ['planId'],
    },
  },

  // SESSION
  {
    name: 'log_workout',
    category: C,
    description:
      'Antrenman kaydet. "1 saat koşu yaptım 8km", "leg day", "yoga 45 dk". Type: strength|run|ride|swim|yoga|hiit|mobility|sport|other.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        durationMin: { type: 'number' },
        intensity: { type: 'number', description: '1-10 RPE' },
        location: { type: 'string' },
        distanceKm: { type: 'number' },
        pace: { type: 'string' },
        notes: { type: 'string' },
        planId: { type: 'string' },
        dateISO: { type: 'string' },
      },
      required: ['type'],
    },
  },
  {
    name: 'list_recent_workouts',
    category: C,
    description: 'Son N gün antrenman.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 14 } },
    },
  },
  {
    name: 'get_weekly_workout_summary',
    category: C,
    description: 'Bu hafta antrenman özeti (sayı, süre, tip dağılımı).',
    parameters: { type: 'object', properties: {} },
  },

  // SET / EXERCISE
  {
    name: 'add_exercise_set',
    category: C,
    description:
      'Set kaydet. "deadlift 100kg 5 rep RPE 8". workoutId yoksa son aktif workout\'a eklenir veya yeni strength session açılır.',
    parameters: {
      type: 'object',
      properties: {
        workoutId: { type: 'string' },
        exerciseName: { type: 'string' },
        setNumber: { type: 'number', default: 1 },
        weight: { type: 'number' },
        reps: { type: 'number' },
        rpe: { type: 'number' },
        durationSec: { type: 'number' },
        distanceM: { type: 'number' },
      },
      required: ['exerciseName'],
    },
  },
  {
    name: 'list_exercise_history',
    category: C,
    description:
      'Bir egzersizin geçmişi (en yüksek 1RM, son setler). "Squat geçmişim", "deadlift PR".',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: { type: 'string' },
        days: { type: 'number', default: 90 },
      },
      required: ['exerciseName'],
    },
  },

  // PR
  {
    name: 'log_pr',
    category: C,
    description: 'Yeni PR kaydet. "Bench 90kg PR", "5k 22:30".',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: { type: 'string' },
        type: {
          type: 'string',
          enum: ['1RM', 'max_reps', 'max_distance', 'min_time', 'max_weight_for_reps'],
        },
        value: { type: 'number' },
        unit: { type: 'string' },
        reps: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['exerciseName', 'type', 'value'],
    },
  },
  {
    name: 'list_prs',
    category: C,
    description: "PR'ları listele (egzersiz veya hepsi).",
    parameters: {
      type: 'object',
      properties: { exerciseName: { type: 'string' } },
    },
  },
  {
    name: 'check_pr_progress',
    category: C,
    description: 'Son N günde PR var mı, hangi egzersizlerde durgun.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 30 } },
    },
  },

  // RACE
  {
    name: 'add_race',
    category: C,
    description: 'Yarış/event ekle. "İstanbul Marathon Mart 12", "Sprint triathlon".',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        dateISO: { type: 'string' },
        category: {
          type: 'string',
          enum: [
            '5k',
            '10k',
            'half_marathon',
            'marathon',
            'ultra',
            'triathlon',
            'cycling',
            'swim',
            'other',
          ],
        },
        distance: { type: 'number' },
        unit: { type: 'string' },
      },
      required: ['name', 'dateISO'],
    },
  },
  {
    name: 'update_race_result',
    category: C,
    description: 'Yarış sonucu. "21k 1:45 bitirdim".',
    parameters: {
      type: 'object',
      properties: {
        raceId: { type: 'string' },
        time: { type: 'string', description: 'hh:mm:ss' },
        position: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['raceId'],
    },
  },
  {
    name: 'list_races',
    category: C,
    description: 'Yarışları listele (upcoming|completed|all).',
    parameters: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['upcoming', 'completed', 'all'] } },
    },
  },

  // GEAR
  {
    name: 'add_gear',
    category: C,
    description: 'Spor malzemesi ekle. "Nike Pegasus 41 aldım", "Yeni bisiklet zinciri".',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        type: {
          type: 'string',
          enum: ['shoe', 'bike', 'racket', 'ski', 'watch', 'helmet', 'other'],
        },
        brand: { type: 'string' },
        purchaseDateISO: { type: 'string' },
      },
      required: ['name', 'type'],
    },
  },
  {
    name: 'log_gear_km',
    category: C,
    description: 'Malzemeye km/saat ekle. "Pegasus ile 8km koştum".',
    parameters: {
      type: 'object',
      properties: {
        gearId: { type: 'string' },
        km: { type: 'number' },
        hours: { type: 'number' },
      },
      required: ['gearId'],
    },
  },
  {
    name: 'list_gear',
    category: C,
    description:
      'Malzemeleri listele. Koşu ayakkabısı için 500-600km eşiğine yaklaşanlar uyarılır.',
    parameters: {
      type: 'object',
      properties: { type: { type: 'string' } },
    },
  },
]

export const sportsExecutors: Record<string, ToolExecutor> = {
  create_workout_plan: {
    name: 'create_workout_plan',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { name: string }
      const plan = await db.workoutPlan.create({
        data: {
          userId,
          name: p.name,
          type: (p.type as string) ?? 'mixed',
          daysPerWeek: (p.daysPerWeek as number) ?? 4,
          durationWeeks: p.durationWeeks as number | undefined,
        },
      })
      return {
        ok: true,
        data: plan,
        display: {
          title: 'Plan oluşturuldu',
          subtitle: `${plan.name} • ${plan.daysPerWeek}gün/hafta`,
          icon: 'figure.strengthtraining.traditional',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  list_workout_plans: {
    name: 'list_workout_plans',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string }
      const where: Record<string, unknown> = { userId, archived: false }
      if (p?.status) where.status = p.status
      const plans = await db.workoutPlan.findMany({ where, orderBy: { startedAt: 'desc' } })
      return {
        ok: true,
        data: { plans, count: plans.length },
        display: {
          title: 'Planlar',
          subtitle: `${plans.length}`,
          icon: 'list.bullet',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  archive_workout_plan: {
    name: 'archive_workout_plan',
    execute: async ({ userId, params }) => {
      const { planId } = params as { planId: string }
      const p = await db.workoutPlan.findFirst({ where: { id: planId, userId } })
      if (!p) return { ok: false, error: 'not_found' }
      await db.workoutPlan.update({ where: { id: planId }, data: { archived: true } })
      return {
        ok: true,
        display: {
          title: 'Plan arşivlendi',
          subtitle: p.name,
          icon: 'archivebox',
          color: '#8E8E93',
        },
      } satisfies ToolResult
    },
  },

  log_workout: {
    name: 'log_workout',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { type: string }
      const session = await db.trainingSession.create({
        data: {
          userId,
          type: p.type,
          durationMin: p.durationMin as number | undefined,
          intensity: p.intensity as number | undefined,
          location: p.location as string | undefined,
          distanceKm: p.distanceKm as number | undefined,
          pace: p.pace as string | undefined,
          notes: p.notes as string | undefined,
          planId: p.planId as string | undefined,
          date: p.dateISO ? new Date(p.dateISO as string) : new Date(),
        },
      })
      const sub = [
        p.durationMin ? `${p.durationMin}dk` : null,
        p.distanceKm ? `${p.distanceKm}km` : null,
        p.pace ? p.pace : null,
      ]
        .filter(Boolean)
        .join(' • ')
      return {
        ok: true,
        data: session,
        display: {
          title: `${p.type} kaydedildi`,
          subtitle: sub || 'Tamamlandı',
          icon: 'figure.run',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  list_recent_workouts: {
    name: 'list_recent_workouts',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 14
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sessions = await db.trainingSession.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'desc' },
        take: 50,
      })
      return {
        ok: true,
        data: { sessions, count: sessions.length },
        display: {
          title: `Son ${days} gün`,
          subtitle: `${sessions.length} antrenman`,
          icon: 'figure.run',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  get_weekly_workout_summary: {
    name: 'get_weekly_workout_summary',
    execute: async ({ userId }) => {
      const start = new Date()
      const day = start.getDay()
      const diff = day === 0 ? -6 : 1 - day
      start.setDate(start.getDate() + diff)
      start.setHours(0, 0, 0, 0)
      const sessions = await db.trainingSession.findMany({
        where: { userId, date: { gte: start } },
      })
      const totalMin = sessions.reduce((acc, s) => acc + (s.durationMin ?? 0), 0)
      const byType: Record<string, number> = {}
      for (const s of sessions) byType[s.type] = (byType[s.type] ?? 0) + 1
      return {
        ok: true,
        data: { count: sessions.length, totalMin, byType, sessions },
        display: {
          title: 'Bu hafta',
          subtitle: `${sessions.length} antrenman • ${totalMin}dk`,
          icon: 'chart.bar.fill',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  add_exercise_set: {
    name: 'add_exercise_set',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { exerciseName: string }
      let workoutId = p.workoutId as string | undefined
      if (!workoutId) {
        // Bugünün strength session'ı var mı, yoksa yeni aç
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const existing = await db.trainingSession.findFirst({
          where: { userId, type: 'strength', date: { gte: today } },
          orderBy: { date: 'desc' },
        })
        if (existing) workoutId = existing.id
        else {
          const fresh = await db.trainingSession.create({
            data: { userId, type: 'strength', date: new Date() },
          })
          workoutId = fresh.id
        }
      }
      const set = await db.exerciseSet.create({
        data: {
          userId,
          workoutId: workoutId!,
          exerciseName: p.exerciseName,
          setNumber: (p.setNumber as number) ?? 1,
          weight: p.weight as number | undefined,
          reps: p.reps as number | undefined,
          rpe: p.rpe as number | undefined,
          durationSec: p.durationSec as number | undefined,
          distanceM: p.distanceM as number | undefined,
        },
      })
      // Otomatik 1RM tahmini → mevcut PR'dan iyi mi
      let prNote: string | null = null
      if (set.weight && set.reps && set.reps > 0) {
        const est1rm = epley1RM(set.weight, set.reps)
        const currentPR = await db.personalRecord.findFirst({
          where: { userId, exerciseName: p.exerciseName, type: '1RM' },
          orderBy: { value: 'desc' },
        })
        if (!currentPR || est1rm > currentPR.value) {
          await db.personalRecord.create({
            data: {
              userId,
              exerciseName: p.exerciseName,
              type: '1RM',
              value: parseFloat(est1rm.toFixed(1)),
              unit: 'kg',
              reps: set.reps,
              notes: 'Otomatik (Epley)',
            },
          })
          prNote = `Yeni 1RM tahmini: ${est1rm.toFixed(1)}kg`
        }
      }
      return {
        ok: true,
        data: { set, prNote },
        display: {
          title: p.exerciseName,
          subtitle: `${set.weight ?? '-'}kg × ${set.reps ?? '-'}${prNote ? ` • ${prNote}` : ''}`,
          icon: 'figure.strengthtraining.traditional',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  list_exercise_history: {
    name: 'list_exercise_history',
    execute: async ({ userId, params }) => {
      const p = params as { exerciseName: string; days?: number }
      const days = p?.days ?? 90
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sets = await db.exerciseSet.findMany({
        where: {
          userId,
          exerciseName: { contains: p.exerciseName, mode: 'insensitive' },
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      })
      const prs = await db.personalRecord.findMany({
        where: { userId, exerciseName: { contains: p.exerciseName, mode: 'insensitive' } },
        orderBy: { date: 'desc' },
        take: 5,
      })
      return {
        ok: true,
        data: { sets, prs, count: sets.length },
        display: {
          title: p.exerciseName,
          subtitle: `${sets.length} set • ${prs.length} PR`,
          icon: 'chart.line.uptrend.xyaxis',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  log_pr: {
    name: 'log_pr',
    execute: async ({ userId, params }) => {
      const p = params as {
        exerciseName: string
        type: string
        value: number
        unit?: string
        reps?: number
        notes?: string
      }
      const previous = await db.personalRecord.findFirst({
        where: { userId, exerciseName: p.exerciseName, type: p.type },
        orderBy: { date: 'desc' },
      })
      const pr = await db.personalRecord.create({
        data: {
          userId,
          exerciseName: p.exerciseName,
          type: p.type,
          value: p.value,
          unit: p.unit,
          reps: p.reps,
          notes: p.notes,
        },
      })
      let delta: string | null = null
      if (previous) {
        const diff = p.value - previous.value
        const pct = (diff / previous.value) * 100
        delta = `Önceki ${previous.value}${p.unit ?? ''} → +${pct.toFixed(1)}%`
      }
      return {
        ok: true,
        data: { pr, previous, delta },
        display: {
          title: `${p.exerciseName} PR`,
          subtitle: `${p.value}${p.unit ?? ''}${delta ? ` • ${delta}` : ''}`,
          icon: 'trophy.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  list_prs: {
    name: 'list_prs',
    execute: async ({ userId, params }) => {
      const p = params as { exerciseName?: string }
      const where: Record<string, unknown> = { userId }
      if (p?.exerciseName) where.exerciseName = { contains: p.exerciseName, mode: 'insensitive' }
      const prs = await db.personalRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 50,
      })
      return {
        ok: true,
        data: { prs, count: prs.length },
        display: {
          title: "PR'lar",
          subtitle: `${prs.length}`,
          icon: 'trophy.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  check_pr_progress: {
    name: 'check_pr_progress',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 30
      const since = new Date()
      since.setDate(since.getDate() - days)
      const recent = await db.personalRecord.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'desc' },
      })
      const exercises = new Set(recent.map((r) => r.exerciseName))
      return {
        ok: true,
        data: { days, count: recent.length, exercises: Array.from(exercises) },
        display: {
          title: `Son ${days} gün PR`,
          subtitle: `${recent.length} kayıt`,
          icon: 'trophy.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  add_race: {
    name: 'add_race',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { name: string; dateISO: string }
      const r = await db.race.create({
        data: {
          userId,
          name: p.name,
          date: new Date(p.dateISO),
          category: p.category as string | undefined,
          distance: p.distance as number | undefined,
          unit: p.unit as string | undefined,
        },
      })
      return {
        ok: true,
        data: r,
        display: {
          title: 'Yarış eklendi',
          subtitle: `${p.name} • ${new Date(p.dateISO).toLocaleDateString('tr-TR')}`,
          icon: 'figure.run',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  update_race_result: {
    name: 'update_race_result',
    execute: async ({ userId, params }) => {
      const p = params as { raceId: string; time?: string; position?: number; notes?: string }
      const r = await db.race.findFirst({ where: { id: p.raceId, userId } })
      if (!r) return { ok: false, error: 'not_found' }
      const updated = await db.race.update({
        where: { id: p.raceId },
        data: {
          time: p.time ?? r.time,
          position: p.position ?? r.position,
          notes: p.notes ?? r.notes,
          status: 'completed',
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Yarış tamamlandı',
          subtitle: `${r.name} • ${updated.time ?? '-'}`,
          icon: 'checkmark.seal.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  list_races: {
    name: 'list_races',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string }
      const where: Record<string, unknown> = { userId }
      if (p?.status && p.status !== 'all') where.status = p.status
      const races = await db.race.findMany({
        where,
        orderBy: { date: 'desc' },
      })
      return {
        ok: true,
        data: { races, count: races.length },
        display: {
          title: 'Yarışlar',
          subtitle: `${races.length}`,
          icon: 'flag.checkered',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  add_gear: {
    name: 'add_gear',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { name: string; type: string }
      const g = await db.gearItem.create({
        data: {
          userId,
          name: p.name,
          type: p.type,
          brand: p.brand as string | undefined,
          purchaseDate: p.purchaseDateISO ? new Date(p.purchaseDateISO as string) : null,
        },
      })
      return {
        ok: true,
        data: g,
        display: {
          title: 'Malzeme eklendi',
          subtitle: g.name,
          icon: 'shoe.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  log_gear_km: {
    name: 'log_gear_km',
    execute: async ({ userId, params }) => {
      const p = params as { gearId: string; km?: number; hours?: number }
      const g = await db.gearItem.findFirst({ where: { id: p.gearId, userId } })
      if (!g) return { ok: false, error: 'not_found' }
      const updated = await db.gearItem.update({
        where: { id: p.gearId },
        data: {
          kmLogged: g.kmLogged + (p.km ?? 0),
          hoursLogged: g.hoursLogged + (p.hours ?? 0),
        },
      })
      // Koşu ayakkabısı için 500km eşiği uyarısı
      let warning: string | null = null
      if (g.type === 'shoe' && updated.kmLogged > 500) {
        warning = `${updated.kmLogged.toFixed(0)}km — değiştirme zamanı yaklaştı`
      }
      return {
        ok: true,
        data: { gear: updated, warning },
        display: {
          title: g.name,
          subtitle: `Toplam ${updated.kmLogged.toFixed(0)}km${warning ? ` • ${warning}` : ''}`,
          icon: 'shoe.fill',
          color: warning ? '#FF9F0A' : '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_gear: {
    name: 'list_gear',
    execute: async ({ userId, params }) => {
      const p = params as { type?: string }
      const where: Record<string, unknown> = { userId, retired: false }
      if (p?.type) where.type = p.type
      const items = await db.gearItem.findMany({ where, orderBy: { kmLogged: 'desc' } })
      return {
        ok: true,
        data: { items, count: items.length },
        display: {
          title: 'Malzemeler',
          subtitle: `${items.length}`,
          icon: 'shoe.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
}
