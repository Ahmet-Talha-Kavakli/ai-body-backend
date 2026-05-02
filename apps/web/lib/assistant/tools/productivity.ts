/**
 * Verim & Odak tool'ları (V2 Faz N).
 * Focus session, Task, Project, TimeBlock, Distraction, WeeklyReview.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

const C = 'tools' as const

function startOfWeek(d: Date): Date {
  const out = new Date(d)
  const day = out.getDay() // 0 Sunday
  const diff = day === 0 ? -6 : 1 - day // Pazartesi başlangıç
  out.setDate(out.getDate() + diff)
  out.setHours(0, 0, 0, 0)
  return out
}

function endOfWeek(d: Date): Date {
  const start = startOfWeek(d)
  const out = new Date(start)
  out.setDate(out.getDate() + 6)
  out.setHours(23, 59, 59, 999)
  return out
}

export const productivityToolDefs: ToolDefinition[] = [
  // ── FOCUS ──
  {
    name: 'start_focus_session',
    category: C,
    description:
      'Pomodoro/deep work session başlatır. "25 dk çalışacağım", "deep work başlıyorum" deyince. taskTitle veya taskId opsiyonel.',
    parameters: {
      type: 'object',
      properties: {
        plannedMinutes: { type: 'number', default: 25 },
        type: {
          type: 'string',
          enum: ['pomodoro', 'deep_work', 'review', 'reading', 'meeting', 'learning'],
          default: 'pomodoro',
        },
        taskId: { type: 'string', description: 'Mevcut bir görev için (varsa)' },
        taskTitle: { type: 'string', description: 'Görev adı (taskId yoksa)' },
        environment: { type: 'string', description: 'ev, ofis, kafe vb.' },
        energyBefore: { type: 'number', description: '1-5 arası enerji' },
      },
    },
  },
  {
    name: 'end_focus_session',
    category: C,
    description:
      'Aktif focus session bitir. actualMinutes verilmezse otomatik hesaplanır. note kullanıcının notu.',
    parameters: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Verilmezse en son aktif session bitirilir' },
        actualMinutes: { type: 'number' },
        energyAfter: { type: 'number' },
        note: { type: 'string' },
        completed: { type: 'boolean', default: true },
      },
    },
  },
  {
    name: 'cancel_focus_session',
    category: C,
    description: 'Aktif focus session iptal et (yarıda bıraktıysan).',
    parameters: {
      type: 'object',
      properties: { sessionId: { type: 'string' }, reason: { type: 'string' } },
    },
  },
  {
    name: 'log_distraction',
    category: C,
    description:
      'Anlık dikkat dağılması kaydet. "Twitter açtım", "telefon çaldı". Aktif session varsa ona bağlanır.',
    parameters: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: [
            'twitter',
            'instagram',
            'tiktok',
            'youtube',
            'sms',
            'telefon',
            'kişi',
            'gürültü',
            'düşünce',
            'açlık',
            'diğer',
          ],
        },
        note: { type: 'string' },
        durationSec: { type: 'number' },
      },
      required: ['source'],
    },
  },
  {
    name: 'get_focus_today',
    category: C,
    description: 'Bugünün toplam focus dakikası, session sayısı, distraction sayısı.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_focus_streak',
    category: C,
    description: 'Üst üste kaç gün focus session yapıldı (en az 1 session/gün).',
    parameters: { type: 'object', properties: {} },
  },

  // ── TASKS ──
  {
    name: 'add_task',
    category: C,
    description: 'Yeni görev ekle. "Yarın 10\'a kadar X bitir", "öğleden sonra Y", "Z\'yi unutma".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          default: 'medium',
        },
        dueISO: { type: 'string', description: 'ISO deadline' },
        estimatedMinutes: { type: 'number' },
        projectId: { type: 'string' },
        parentTaskId: { type: 'string', description: 'Alt görev için' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_tasks',
    category: C,
    description:
      'Görevleri listele. status/priority/projectId filtreleri. "yapılacaklarım", "yüksek öncelikli görevler".',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['todo', 'in_progress', 'done', 'cancelled', 'all'],
          default: 'todo',
        },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        projectId: { type: 'string' },
        limit: { type: 'number', default: 30 },
      },
    },
  },
  {
    name: 'update_task',
    category: C,
    description: 'Bir görevi güncelle (başlık/durum/öncelik/deadline/açıklama).',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'cancelled'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        dueISO: { type: 'string' },
        estimatedMinutes: { type: 'number' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'complete_task',
    category: C,
    description:
      'Bir görevi tamamlandı işaretle. actualMinutes opsiyonel (gerçekten ne kadar sürdü?).',
    parameters: {
      type: 'object',
      properties: {
        taskId: { type: 'string' },
        actualMinutes: { type: 'number' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'delete_task',
    category: C,
    description: 'Bir görevi sil.',
    parameters: {
      type: 'object',
      properties: { taskId: { type: 'string' } },
      required: ['taskId'],
    },
    destructive: true,
  },
  {
    name: 'search_tasks',
    category: C,
    description: 'Görevlerde başlığa göre arama.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'get_overdue_tasks',
    category: C,
    description: 'Tarihi geçmiş ama tamamlanmamış görevler.',
    parameters: { type: 'object', properties: {} },
  },

  // ── PROJECTS ──
  {
    name: 'create_project',
    category: C,
    description:
      'Büyük iş kümesi oluştur. "Doktora tezi projesi", "yeni mobile app", "tatil planı".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        color: { type: 'string', description: 'Hex renk' },
        deadlineISO: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_projects',
    category: C,
    description: 'Aktif projeleri ve task sayılarını listeler.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'paused', 'done', 'archived', 'all'] },
      },
    },
  },
  {
    name: 'update_project',
    category: C,
    description: 'Proje güncelle (durum, başlık, deadline).',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused', 'done', 'archived'] },
        deadlineISO: { type: 'string' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'archive_project',
    category: C,
    description: 'Proje arşivle.',
    parameters: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },

  // ── TIME BLOCK ──
  {
    name: 'add_time_block',
    category: C,
    description:
      'Günlük takvim bloğu (deep work, toplantı, mola). "Yarın 9-11 deep work", "öğlen 12-1 yemek".',
    parameters: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        startISO: { type: 'string' },
        endISO: { type: 'string' },
        category: {
          type: 'string',
          enum: ['deep_work', 'meeting', 'break', 'exercise', 'meal', 'personal', 'other'],
          default: 'deep_work',
        },
        taskId: { type: 'string' },
      },
      required: ['label', 'startISO', 'endISO'],
    },
  },
  {
    name: 'list_today_blocks',
    category: C,
    description: 'Bugünün time block listesi.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'delete_time_block',
    category: C,
    description: 'Time block sil.',
    parameters: {
      type: 'object',
      properties: { blockId: { type: 'string' } },
      required: ['blockId'],
    },
    destructive: true,
  },

  // ── WEEKLY REVIEW ──
  {
    name: 'start_weekly_review',
    category: C,
    description:
      'Geçen haftanın özetini AI hesaplar. Focus dakika, tamamlanan/geciken task, distraction, en üretken gün.',
    parameters: {
      type: 'object',
      properties: {
        weeksBack: { type: 'number', default: 0, description: '0 bu hafta, 1 geçen hafta' },
      },
    },
  },
  {
    name: 'save_weekly_review',
    category: C,
    description: "Haftalık review'a kullanıcı notu ekle (wins, losses, blockers, userNotes).",
    parameters: {
      type: 'object',
      properties: {
        weekStartISO: { type: 'string', description: "Hangi haftanın review'u (Pazartesi)" },
        wins: { type: 'array', items: { type: 'string' } },
        losses: { type: 'array', items: { type: 'string' } },
        blockers: { type: 'array', items: { type: 'string' } },
        userNotes: { type: 'string' },
      },
      required: ['weekStartISO'],
    },
  },
]

// ────────────────────────────────────────────────────
// EXECUTORS
// ────────────────────────────────────────────────────

export const productivityExecutors: Record<string, ToolExecutor> = {
  start_focus_session: {
    name: 'start_focus_session',
    execute: async ({ userId, params }) => {
      const p = params as {
        plannedMinutes?: number
        type?: string
        taskId?: string
        taskTitle?: string
        environment?: string
        energyBefore?: number
      }
      // Aktif bir session varsa otomatik bitir
      const existing = await db.focusSession.findFirst({
        where: { userId, endedAt: null, cancelled: false },
      })
      if (existing) {
        await db.focusSession.update({
          where: { id: existing.id },
          data: { endedAt: new Date(), cancelled: true },
        })
      }
      const session = await db.focusSession.create({
        data: {
          userId,
          plannedMinutes: p.plannedMinutes ?? 25,
          type: p.type ?? 'pomodoro',
          taskId: p.taskId,
          taskTitle: p.taskTitle,
          environment: p.environment,
          energyBefore: p.energyBefore,
        },
      })
      return {
        ok: true,
        data: session,
        display: {
          title: `${session.plannedMinutes} dk focus`,
          subtitle: p.taskTitle ?? p.type ?? 'Pomodoro',
          icon: 'timer',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  end_focus_session: {
    name: 'end_focus_session',
    execute: async ({ userId, params }) => {
      const p = params as {
        sessionId?: string
        actualMinutes?: number
        energyAfter?: number
        note?: string
        completed?: boolean
      }
      const session = p.sessionId
        ? await db.focusSession.findFirst({ where: { id: p.sessionId, userId } })
        : await db.focusSession.findFirst({
            where: { userId, endedAt: null, cancelled: false },
            orderBy: { startedAt: 'desc' },
          })
      if (!session) return { ok: false, error: 'no_active_session' }
      const endedAt = new Date()
      const actual =
        p.actualMinutes ?? Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000)
      const distractionCount = await db.distraction.count({ where: { sessionId: session.id } })
      const updated = await db.focusSession.update({
        where: { id: session.id },
        data: {
          endedAt,
          actualMinutes: actual,
          energyAfter: p.energyAfter,
          note: p.note,
          completed: p.completed ?? true,
          distractionCount,
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Focus tamamlandı',
          subtitle: `${actual} dk • ${distractionCount} dağılma`,
          icon: 'checkmark.circle.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  cancel_focus_session: {
    name: 'cancel_focus_session',
    execute: async ({ userId, params }) => {
      const p = params as { sessionId?: string; reason?: string }
      const session = p.sessionId
        ? await db.focusSession.findFirst({ where: { id: p.sessionId, userId } })
        : await db.focusSession.findFirst({
            where: { userId, endedAt: null, cancelled: false },
            orderBy: { startedAt: 'desc' },
          })
      if (!session) return { ok: false, error: 'no_active_session' }
      const endedAt = new Date()
      const actual = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000)
      const updated = await db.focusSession.update({
        where: { id: session.id },
        data: { endedAt, actualMinutes: actual, cancelled: true, note: p.reason },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Focus iptal edildi',
          subtitle: `${actual} dk • ${p.reason ?? 'sebep verilmedi'}`,
          icon: 'xmark.circle',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  log_distraction: {
    name: 'log_distraction',
    execute: async ({ userId, params }) => {
      const p = params as { source: string; note?: string; durationSec?: number }
      const activeSession = await db.focusSession.findFirst({
        where: { userId, endedAt: null, cancelled: false },
        orderBy: { startedAt: 'desc' },
      })
      const d = await db.distraction.create({
        data: {
          userId,
          sessionId: activeSession?.id,
          source: p.source,
          note: p.note,
          durationSec: p.durationSec,
        },
      })
      return {
        ok: true,
        data: d,
        display: {
          title: 'Dağılma kaydedildi',
          subtitle: p.source,
          icon: 'exclamationmark.triangle',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  get_focus_today: {
    name: 'get_focus_today',
    execute: async ({ userId }) => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const sessions = await db.focusSession.findMany({
        where: { userId, startedAt: { gte: start } },
      })
      const totalMin = sessions.reduce((acc, s) => acc + (s.actualMinutes ?? 0), 0)
      const completed = sessions.filter((s) => s.completed && !s.cancelled).length
      const distractions = await db.distraction.count({
        where: { userId, createdAt: { gte: start } },
      })
      return {
        ok: true,
        data: { totalMinutes: totalMin, sessionCount: sessions.length, completed, distractions },
        display: {
          title: 'Bugün focus',
          subtitle: `${totalMin} dk • ${completed} session • ${distractions} dağılma`,
          icon: 'timer',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  get_focus_streak: {
    name: 'get_focus_streak',
    execute: async ({ userId }) => {
      const sessions = await db.focusSession.findMany({
        where: { userId, completed: true, cancelled: false },
        orderBy: { startedAt: 'desc' },
        take: 200,
        select: { startedAt: true },
      })
      const days = new Set<string>()
      for (const s of sessions) days.add(s.startedAt.toISOString().slice(0, 10))
      let streak = 0
      const cursor = new Date()
      cursor.setHours(0, 0, 0, 0)
      while (days.has(cursor.toISOString().slice(0, 10))) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      }
      return {
        ok: true,
        data: { streak },
        display: {
          title: `${streak} gün streak`,
          subtitle: streak > 0 ? 'Devam et' : 'Bugün başlat',
          icon: 'flame.fill',
          color: streak > 0 ? '#FF6B35' : '#8E8E93',
        },
      } satisfies ToolResult
    },
  },

  add_task: {
    name: 'add_task',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        description?: string
        priority?: string
        dueISO?: string
        estimatedMinutes?: number
        projectId?: string
        parentTaskId?: string
        tags?: string[]
      }
      const t = await db.taskItem.create({
        data: {
          userId,
          title: p.title,
          description: p.description,
          priority: p.priority ?? 'medium',
          dueDate: p.dueISO ? new Date(p.dueISO) : null,
          estimatedMinutes: p.estimatedMinutes,
          projectId: p.projectId,
          parentTaskId: p.parentTaskId,
          tags: p.tags ?? [],
        },
      })
      return {
        ok: true,
        data: t,
        display: {
          title: `Görev: ${t.title}`,
          subtitle: p.dueISO
            ? `Deadline: ${new Date(p.dueISO).toLocaleDateString('tr-TR')}`
            : (t.priority ?? 'medium'),
          icon: 'checklist',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_tasks: {
    name: 'list_tasks',
    execute: async ({ userId, params }) => {
      const p = params as {
        status?: string
        priority?: string
        projectId?: string
        limit?: number
      }
      const where: Record<string, unknown> = { userId }
      if (p?.status && p.status !== 'all') where.status = p.status
      else if (!p?.status) where.status = 'todo'
      if (p?.priority) where.priority = p.priority
      if (p?.projectId) where.projectId = p.projectId
      const tasks = await db.taskItem.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        take: Math.min(p?.limit ?? 30, 100),
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedMinutes: true,
          tags: true,
        },
      })
      return {
        ok: true,
        data: { tasks, count: tasks.length },
        display: {
          title: 'Görevler',
          subtitle: `${tasks.length} görev`,
          icon: 'checklist',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  update_task: {
    name: 'update_task',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { taskId: string }
      const t = await db.taskItem.findFirst({ where: { id: p.taskId, userId } })
      if (!t) return { ok: false, error: 'not_found' }
      const data: Record<string, unknown> = {}
      if (p.title) data.title = p.title
      if (p.description) data.description = p.description
      if (p.status) data.status = p.status
      if (p.priority) data.priority = p.priority
      if (p.dueISO) data.dueDate = new Date(p.dueISO as string)
      if (p.estimatedMinutes) data.estimatedMinutes = p.estimatedMinutes
      if (p.status === 'done' && !t.completedAt) data.completedAt = new Date()
      const updated = await db.taskItem.update({ where: { id: p.taskId }, data })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Görev güncellendi',
          subtitle: updated.title,
          icon: 'pencil',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  complete_task: {
    name: 'complete_task',
    execute: async ({ userId, params }) => {
      const p = params as { taskId: string; actualMinutes?: number }
      const t = await db.taskItem.findFirst({ where: { id: p.taskId, userId } })
      if (!t) return { ok: false, error: 'not_found' }
      const updated = await db.taskItem.update({
        where: { id: p.taskId },
        data: { status: 'done', completedAt: new Date(), actualMinutes: p.actualMinutes },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Tamamlandı ✓',
          subtitle: t.title,
          icon: 'checkmark.circle.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  delete_task: {
    name: 'delete_task',
    execute: async ({ userId, params }) => {
      const { taskId } = params as { taskId: string }
      const t = await db.taskItem.findFirst({ where: { id: taskId, userId } })
      if (!t) return { ok: false, error: 'not_found' }
      await db.taskItem.delete({ where: { id: taskId } })
      return {
        ok: true,
        display: { title: 'Görev silindi', subtitle: t.title, icon: 'trash', color: '#8E8E93' },
      } satisfies ToolResult
    },
  },

  search_tasks: {
    name: 'search_tasks',
    execute: async ({ userId, params }) => {
      const { query } = params as { query: string }
      const tasks = await db.taskItem.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        take: 30,
      })
      return {
        ok: true,
        data: { tasks, count: tasks.length, query },
        display: {
          title: `"${query}"`,
          subtitle: `${tasks.length} görev`,
          icon: 'magnifyingglass',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  get_overdue_tasks: {
    name: 'get_overdue_tasks',
    execute: async ({ userId }) => {
      const tasks = await db.taskItem.findMany({
        where: {
          userId,
          status: { in: ['todo', 'in_progress'] },
          dueDate: { lt: new Date() },
        },
        orderBy: { dueDate: 'asc' },
        take: 50,
      })
      return {
        ok: true,
        data: { tasks, count: tasks.length },
        display: {
          title: 'Geciken görevler',
          subtitle: `${tasks.length} görev`,
          icon: 'exclamationmark.triangle.fill',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  create_project: {
    name: 'create_project',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        description?: string
        color?: string
        deadlineISO?: string
      }
      const proj = await db.taskProject.create({
        data: {
          userId,
          title: p.title,
          description: p.description,
          color: p.color ?? '#5E5CE6',
          deadline: p.deadlineISO ? new Date(p.deadlineISO) : null,
        },
      })
      return {
        ok: true,
        data: proj,
        display: {
          title: 'Proje oluşturuldu',
          subtitle: proj.title,
          icon: 'folder.fill',
          color: proj.color,
        },
      } satisfies ToolResult
    },
  },

  list_projects: {
    name: 'list_projects',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string }
      const where: Record<string, unknown> = { userId }
      if (p?.status && p.status !== 'all') {
        if (p.status === 'archived') where.archived = true
        else where.status = p.status
      } else where.archived = false
      const projects = await db.taskProject.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { tasks: { where: { status: { not: 'done' } } } } },
        },
      })
      return {
        ok: true,
        data: { projects, count: projects.length },
        display: {
          title: 'Projeler',
          subtitle: `${projects.length}`,
          icon: 'folder.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  update_project: {
    name: 'update_project',
    execute: async ({ userId, params }) => {
      const p = params as {
        projectId: string
        title?: string
        status?: string
        deadlineISO?: string
      }
      const proj = await db.taskProject.findFirst({ where: { id: p.projectId, userId } })
      if (!proj) return { ok: false, error: 'not_found' }
      const updated = await db.taskProject.update({
        where: { id: p.projectId },
        data: {
          title: p.title ?? proj.title,
          status: p.status ?? proj.status,
          deadline: p.deadlineISO ? new Date(p.deadlineISO) : proj.deadline,
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Proje güncellendi',
          subtitle: updated.title,
          icon: 'pencil',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  archive_project: {
    name: 'archive_project',
    execute: async ({ userId, params }) => {
      const { projectId } = params as { projectId: string }
      const proj = await db.taskProject.findFirst({ where: { id: projectId, userId } })
      if (!proj) return { ok: false, error: 'not_found' }
      await db.taskProject.update({ where: { id: projectId }, data: { archived: true } })
      return {
        ok: true,
        display: {
          title: 'Proje arşivlendi',
          subtitle: proj.title,
          icon: 'archivebox',
          color: '#8E8E93',
        },
      } satisfies ToolResult
    },
  },

  add_time_block: {
    name: 'add_time_block',
    execute: async ({ userId, params }) => {
      const p = params as {
        label: string
        startISO: string
        endISO: string
        category?: string
        taskId?: string
      }
      const block = await db.timeBlock.create({
        data: {
          userId,
          label: p.label,
          startTime: new Date(p.startISO),
          endTime: new Date(p.endISO),
          category: p.category ?? 'deep_work',
          taskId: p.taskId,
        },
      })
      return {
        ok: true,
        data: block,
        display: {
          title: `Blok: ${p.label}`,
          subtitle: `${new Date(p.startISO).toLocaleString('tr-TR')} → ${new Date(p.endISO).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`,
          icon: 'calendar.day.timeline.left',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_today_blocks: {
    name: 'list_today_blocks',
    execute: async ({ userId }) => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const blocks = await db.timeBlock.findMany({
        where: { userId, startTime: { gte: start, lt: end } },
        orderBy: { startTime: 'asc' },
      })
      return {
        ok: true,
        data: { blocks, count: blocks.length },
        display: {
          title: 'Bugünün planı',
          subtitle: `${blocks.length} blok`,
          icon: 'calendar.day.timeline.left',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  delete_time_block: {
    name: 'delete_time_block',
    execute: async ({ userId, params }) => {
      const { blockId } = params as { blockId: string }
      const b = await db.timeBlock.findFirst({ where: { id: blockId, userId } })
      if (!b) return { ok: false, error: 'not_found' }
      await db.timeBlock.delete({ where: { id: blockId } })
      return {
        ok: true,
        display: { title: 'Blok silindi', subtitle: b.label, icon: 'trash', color: '#8E8E93' },
      } satisfies ToolResult
    },
  },

  start_weekly_review: {
    name: 'start_weekly_review',
    execute: async ({ userId, params }) => {
      const p = params as { weeksBack?: number }
      const weeksBack = p?.weeksBack ?? 0
      const ref = new Date()
      ref.setDate(ref.getDate() - weeksBack * 7)
      const ws = startOfWeek(ref)
      const we = endOfWeek(ref)

      const [sessions, completedTasks, overdueTasks, distractions] = await Promise.all([
        db.focusSession.findMany({
          where: { userId, startedAt: { gte: ws, lte: we } },
        }),
        db.taskItem.count({
          where: { userId, completedAt: { gte: ws, lte: we } },
        }),
        db.taskItem.count({
          where: {
            userId,
            status: { in: ['todo', 'in_progress'] },
            dueDate: { lt: new Date(), gte: ws },
          },
        }),
        db.distraction.count({
          where: { userId, createdAt: { gte: ws, lte: we } },
        }),
      ])

      const totalFocusMin = sessions.reduce((acc, s) => acc + (s.actualMinutes ?? 0), 0)

      // En üretken/en zayıf gün
      const minByDay: Record<string, number> = {}
      for (const s of sessions) {
        const dayKey = s.startedAt.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        minByDay[dayKey] = (minByDay[dayKey] ?? 0) + (s.actualMinutes ?? 0)
      }
      const sortedDays = Object.entries(minByDay).sort((a, b) => b[1] - a[1])
      const bestDay = sortedDays[0]?.[0] ?? null
      const worstDay = sortedDays[sortedDays.length - 1]?.[0] ?? null

      // Productivity score (basit formül): focus_min/300 + completed/10 - overdue*0.05 - distractions*0.01
      const rawScore =
        Math.min(totalFocusMin / 300, 1) * 50 +
        Math.min(completedTasks / 10, 1) * 30 -
        overdueTasks * 5 -
        distractions * 0.5
      const productivityScore = Math.max(0, Math.min(100, Math.round(rawScore + 30)))

      const review = await db.weeklyReview.upsert({
        where: { userId_weekStart: { userId, weekStart: ws } },
        create: {
          userId,
          weekStart: ws,
          weekEnd: we,
          productivityScore,
          totalFocusMinutes: totalFocusMin,
          completedTasks,
          overdueTasks,
          totalDistractions: distractions,
          bestDay,
          worstDay,
        },
        update: {
          productivityScore,
          totalFocusMinutes: totalFocusMin,
          completedTasks,
          overdueTasks,
          totalDistractions: distractions,
          bestDay,
          worstDay,
        },
      })

      return {
        ok: true,
        data: review,
        display: {
          title: `Haftalık review`,
          subtitle: `${productivityScore}/100 • ${totalFocusMin}dk focus • ${completedTasks} bitti`,
          icon: 'chart.bar.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  save_weekly_review: {
    name: 'save_weekly_review',
    execute: async ({ userId, params }) => {
      const p = params as {
        weekStartISO: string
        wins?: string[]
        losses?: string[]
        blockers?: string[]
        userNotes?: string
      }
      const ws = new Date(p.weekStartISO)
      const review = await db.weeklyReview.findFirst({
        where: { userId, weekStart: ws },
      })
      if (!review) return { ok: false, error: 'review_not_found' }
      const updated = await db.weeklyReview.update({
        where: { id: review.id },
        data: {
          wins: p.wins ?? review.wins,
          losses: p.losses ?? review.losses,
          blockers: p.blockers ?? review.blockers,
          userNotes: p.userNotes ?? review.userNotes,
        },
      })
      return {
        ok: true,
        data: updated,
        display: { title: 'Review kaydedildi', icon: 'checkmark.circle.fill', color: '#30D158' },
      } satisfies ToolResult
    },
  },
}
