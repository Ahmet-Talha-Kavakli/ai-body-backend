/**
 * Hobi & Öğrenme tool'ları (V2 Faz N).
 * Book, MediaItem, Course, Hobby, HobbySession, LearningGoal, FreeNote.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

const C = 'tools' as const

export const hobbyToolDefs: ToolDefinition[] = [
  // BOOK
  {
    name: 'add_book',
    category: C,
    description:
      'Kitap kaydet. "Sapiens okumaya başladım", "Atomic Habits wishlist". Status: wishlist|reading|finished.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        author: { type: 'string' },
        status: { type: 'string', enum: ['wishlist', 'reading', 'finished', 'abandoned'] },
        totalPages: { type: 'number' },
        genre: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_book_progress',
    category: C,
    description: 'Kitap ilerlemesi. "Sapiens %60", "page 200".',
    parameters: {
      type: 'object',
      properties: {
        bookId: { type: 'string' },
        currentPage: { type: 'number' },
      },
      required: ['bookId'],
    },
  },
  {
    name: 'finish_book',
    category: C,
    description: 'Kitabı bitir + rating.',
    parameters: {
      type: 'object',
      properties: {
        bookId: { type: 'string' },
        rating: { type: 'number', description: '1-5' },
        notes: { type: 'string' },
      },
      required: ['bookId'],
    },
  },
  {
    name: 'list_books',
    category: C,
    description: 'Kitapları listele (status filtresi).',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['wishlist', 'reading', 'finished', 'abandoned', 'all'] },
      },
    },
  },
  {
    name: 'search_books',
    category: C,
    description: 'Kitaplarda title/author/notes arama.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },

  // MEDIA
  {
    name: 'add_media',
    category: C,
    description: 'Film/dizi/anime/podcast kaydet.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        kind: {
          type: 'string',
          enum: ['movie', 'tv', 'anime', 'podcast', 'documentary', 'youtube_channel'],
        },
        status: { type: 'string', enum: ['wishlist', 'watching', 'finished', 'dropped'] },
        platform: { type: 'string' },
        genre: { type: 'string' },
        totalEpisodes: { type: 'number' },
      },
      required: ['title', 'kind'],
    },
  },
  {
    name: 'update_media_progress',
    category: C,
    description: 'Bölüm/sezon ilerlemesi. "House of Cards S2E5".',
    parameters: {
      type: 'object',
      properties: {
        mediaId: { type: 'string' },
        currentEpisode: { type: 'number' },
        currentSeason: { type: 'number' },
      },
      required: ['mediaId'],
    },
  },
  {
    name: 'finish_media',
    category: C,
    description: 'Bittiğini işaretle + rating.',
    parameters: {
      type: 'object',
      properties: {
        mediaId: { type: 'string' },
        rating: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['mediaId'],
    },
  },
  {
    name: 'list_media',
    category: C,
    description: 'Film/dizi/podcast listele (kind+status filtresi).',
    parameters: {
      type: 'object',
      properties: {
        kind: { type: 'string' },
        status: { type: 'string' },
      },
    },
  },

  // COURSE
  {
    name: 'add_course',
    category: C,
    description:
      'Kurs/eğitim kaydet. "React kursuna başladım Udemy", "Coursera ML Specialization".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        provider: { type: 'string' },
        deadlineISO: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_course_progress',
    category: C,
    description: 'Kurs ilerlemesi (progress 0-100 ve/veya hoursSpent).',
    parameters: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        progress: { type: 'number' },
        hoursSpent: { type: 'number' },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'complete_course',
    category: C,
    description: 'Kursu tamamlandı işaretle.',
    parameters: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        certificateUrl: { type: 'string' },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'list_courses',
    category: C,
    description: 'Kursları listele.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'paused', 'completed', 'abandoned', 'all'] },
      },
    },
  },

  // HOBBY
  {
    name: 'add_hobby',
    category: C,
    description: 'Yeni hobi başlat. "Gitar çalmaya başladım", "fotoğrafçılık".',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        skillLevel: {
          type: 'string',
          enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'log_hobby_session',
    category: C,
    description: 'Hobiye harcanan zaman. "1 saat gitar", "30 dk çizim".',
    parameters: {
      type: 'object',
      properties: {
        hobbyId: { type: 'string' },
        durationMin: { type: 'number' },
        note: { type: 'string' },
      },
      required: ['hobbyId', 'durationMin'],
    },
  },
  {
    name: 'list_hobbies',
    category: C,
    description: 'Hobileri listele (toplam saat + son pratik tarihi).',
    parameters: { type: 'object', properties: {} },
  },

  // LEARNING GOAL
  {
    name: 'set_learning_goal',
    category: C,
    description: 'Öğrenme hedefi. "İngilizce C1 6 ay", "Python advanced 1 yıl".',
    parameters: {
      type: 'object',
      properties: {
        skill: { type: 'string' },
        targetLevel: { type: 'string' },
        currentLevel: { type: 'string' },
        deadlineISO: { type: 'string' },
        milestones: { type: 'array', items: { type: 'string' } },
      },
      required: ['skill'],
    },
  },
  {
    name: 'list_learning_goals',
    category: C,
    description: 'Öğrenme hedeflerini listele.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'update_learning_milestone',
    category: C,
    description: 'Öğrenme hedefini güncelle (level, milestones).',
    parameters: {
      type: 'object',
      properties: {
        goalId: { type: 'string' },
        currentLevel: { type: 'string' },
        addMilestone: { type: 'string' },
        achieved: { type: 'boolean' },
      },
      required: ['goalId'],
    },
  },

  // FREE NOTE
  {
    name: 'add_note',
    category: C,
    description:
      'Serbest not (kitap alıntısı, podcast notu, fikir tohumu). "Bu kitaptan müthiş bir alıntı".',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        title: { type: 'string' },
        source: {
          type: 'string',
          enum: ['book', 'podcast', 'article', 'conversation', 'idea', 'other'],
        },
        sourceRef: { type: 'string', description: 'Kitap/podcast adı' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['content'],
    },
  },
  {
    name: 'search_notes',
    category: C,
    description: 'Notlarda title/content/tag arama.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },
  {
    name: 'list_recent_notes',
    category: C,
    description: 'Son N gündeki notlar.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 30 } },
    },
  },
]

export const hobbyExecutors: Record<string, ToolExecutor> = {
  add_book: {
    name: 'add_book',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { title: string }
      const b = await db.book.create({
        data: {
          userId,
          title: p.title,
          author: p.author as string | undefined,
          status: (p.status as string) ?? 'reading',
          totalPages: p.totalPages as number | undefined,
          genre: p.genre as string | undefined,
          startedAt: p.status === 'reading' ? new Date() : null,
        },
      })
      return {
        ok: true,
        data: b,
        display: { title: 'Kitap eklendi', subtitle: b.title, icon: 'book.fill', color: '#5E5CE6' },
      } satisfies ToolResult
    },
  },

  update_book_progress: {
    name: 'update_book_progress',
    execute: async ({ userId, params }) => {
      const p = params as { bookId: string; currentPage?: number }
      const b = await db.book.findFirst({ where: { id: p.bookId, userId } })
      if (!b) return { ok: false, error: 'not_found' }
      const updated = await db.book.update({
        where: { id: p.bookId },
        data: { currentPage: p.currentPage ?? b.currentPage },
      })
      const pct = updated.totalPages
        ? Math.round((updated.currentPage / updated.totalPages) * 100)
        : null
      return {
        ok: true,
        data: updated,
        display: {
          title: b.title,
          subtitle: pct ? `%${pct}` : `Sayfa ${updated.currentPage}`,
          icon: 'book.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  finish_book: {
    name: 'finish_book',
    execute: async ({ userId, params }) => {
      const p = params as { bookId: string; rating?: number; notes?: string }
      const b = await db.book.findFirst({ where: { id: p.bookId, userId } })
      if (!b) return { ok: false, error: 'not_found' }
      const updated = await db.book.update({
        where: { id: p.bookId },
        data: {
          status: 'finished',
          finishedAt: new Date(),
          rating: p.rating,
          notes: p.notes,
          currentPage: b.totalPages ?? b.currentPage,
        },
      })
      // Bu yıl kaçıncı kitap
      const yearStart = new Date(new Date().getFullYear(), 0, 1)
      const count = await db.book.count({
        where: { userId, status: 'finished', finishedAt: { gte: yearStart } },
      })
      return {
        ok: true,
        data: { book: updated, yearCount: count },
        display: {
          title: 'Kitap bitti',
          subtitle: `${b.title} • ${count}. kitap (yıl)`,
          icon: 'checkmark.seal.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  list_books: {
    name: 'list_books',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string }
      const where: Record<string, unknown> = { userId }
      if (p?.status && p.status !== 'all') where.status = p.status
      const books = await db.book.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })
      return {
        ok: true,
        data: { books, count: books.length },
        display: {
          title: 'Kitaplar',
          subtitle: `${books.length}`,
          icon: 'books.vertical.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  search_books: {
    name: 'search_books',
    execute: async ({ userId, params }) => {
      const { query } = params as { query: string }
      const books = await db.book.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { author: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      })
      return {
        ok: true,
        data: { books, count: books.length, query },
        display: {
          title: `"${query}"`,
          subtitle: `${books.length} kitap`,
          icon: 'magnifyingglass',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  add_media: {
    name: 'add_media',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { title: string; kind: string }
      const m = await db.mediaItem.create({
        data: {
          userId,
          title: p.title,
          kind: p.kind,
          status: (p.status as string) ?? 'watching',
          platform: p.platform as string | undefined,
          genre: p.genre as string | undefined,
          totalEpisodes: p.totalEpisodes as number | undefined,
          startedAt: p.status === 'watching' ? new Date() : null,
        },
      })
      return {
        ok: true,
        data: m,
        display: {
          title: m.title,
          subtitle: `${m.kind} • ${m.status}`,
          icon: 'play.rectangle.fill',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  update_media_progress: {
    name: 'update_media_progress',
    execute: async ({ userId, params }) => {
      const p = params as {
        mediaId: string
        currentEpisode?: number
        currentSeason?: number
      }
      const m = await db.mediaItem.findFirst({ where: { id: p.mediaId, userId } })
      if (!m) return { ok: false, error: 'not_found' }
      const updated = await db.mediaItem.update({
        where: { id: p.mediaId },
        data: {
          currentEpisode: p.currentEpisode ?? m.currentEpisode,
          currentSeason: p.currentSeason ?? m.currentSeason,
        },
      })
      const eps =
        updated.currentSeason && updated.currentEpisode
          ? `S${updated.currentSeason}E${updated.currentEpisode}`
          : `Bölüm ${updated.currentEpisode ?? '-'}`
      return {
        ok: true,
        data: updated,
        display: { title: m.title, subtitle: eps, icon: 'play.rectangle.fill', color: '#FF453A' },
      } satisfies ToolResult
    },
  },

  finish_media: {
    name: 'finish_media',
    execute: async ({ userId, params }) => {
      const p = params as { mediaId: string; rating?: number; notes?: string }
      const m = await db.mediaItem.findFirst({ where: { id: p.mediaId, userId } })
      if (!m) return { ok: false, error: 'not_found' }
      const updated = await db.mediaItem.update({
        where: { id: p.mediaId },
        data: {
          status: 'finished',
          finishedAt: new Date(),
          rating: p.rating,
          notes: p.notes,
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Bitti',
          subtitle: m.title,
          icon: 'checkmark.seal.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  list_media: {
    name: 'list_media',
    execute: async ({ userId, params }) => {
      const p = params as { kind?: string; status?: string }
      const where: Record<string, unknown> = { userId }
      if (p?.kind) where.kind = p.kind
      if (p?.status) where.status = p.status
      const media = await db.mediaItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })
      return {
        ok: true,
        data: { media, count: media.length },
        display: {
          title: 'Media',
          subtitle: `${media.length}`,
          icon: 'play.rectangle.fill',
          color: '#FF453A',
        },
      } satisfies ToolResult
    },
  },

  add_course: {
    name: 'add_course',
    execute: async ({ userId, params }) => {
      const p = params as { title: string; provider?: string; deadlineISO?: string }
      const c = await db.course.create({
        data: {
          userId,
          title: p.title,
          provider: p.provider,
          deadline: p.deadlineISO ? new Date(p.deadlineISO) : null,
        },
      })
      return {
        ok: true,
        data: c,
        display: {
          title: 'Kurs eklendi',
          subtitle: p.provider ? `${p.title} • ${p.provider}` : p.title,
          icon: 'graduationcap.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  update_course_progress: {
    name: 'update_course_progress',
    execute: async ({ userId, params }) => {
      const p = params as { courseId: string; progress?: number; hoursSpent?: number }
      const c = await db.course.findFirst({ where: { id: p.courseId, userId } })
      if (!c) return { ok: false, error: 'not_found' }
      const updated = await db.course.update({
        where: { id: p.courseId },
        data: {
          progress: p.progress ?? c.progress,
          hoursSpent: p.hoursSpent != null ? p.hoursSpent : c.hoursSpent,
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: c.title,
          subtitle: `%${updated.progress} • ${updated.hoursSpent.toFixed(1)} saat`,
          icon: 'graduationcap.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  complete_course: {
    name: 'complete_course',
    execute: async ({ userId, params }) => {
      const p = params as { courseId: string; certificateUrl?: string }
      const c = await db.course.findFirst({ where: { id: p.courseId, userId } })
      if (!c) return { ok: false, error: 'not_found' }
      const updated = await db.course.update({
        where: { id: p.courseId },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          certificateUrl: p.certificateUrl,
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Kurs tamamlandı',
          subtitle: c.title,
          icon: 'checkmark.seal.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  list_courses: {
    name: 'list_courses',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string }
      const where: Record<string, unknown> = { userId }
      if (p?.status && p.status !== 'all') where.status = p.status
      const courses = await db.course.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      })
      return {
        ok: true,
        data: { courses, count: courses.length },
        display: {
          title: 'Kurslar',
          subtitle: `${courses.length}`,
          icon: 'graduationcap.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  add_hobby: {
    name: 'add_hobby',
    execute: async ({ userId, params }) => {
      const p = params as { name: string; category?: string; skillLevel?: string }
      const h = await db.hobby.create({
        data: { userId, name: p.name, category: p.category, skillLevel: p.skillLevel },
      })
      return {
        ok: true,
        data: h,
        display: {
          title: 'Hobi eklendi',
          subtitle: h.name,
          icon: 'paintpalette.fill',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  log_hobby_session: {
    name: 'log_hobby_session',
    execute: async ({ userId, params }) => {
      const p = params as { hobbyId: string; durationMin: number; note?: string }
      const h = await db.hobby.findFirst({ where: { id: p.hobbyId, userId } })
      if (!h) return { ok: false, error: 'not_found' }
      await db.hobbySession.create({
        data: { userId, hobbyId: p.hobbyId, durationMin: p.durationMin, note: p.note },
      })
      const updated = await db.hobby.update({
        where: { id: p.hobbyId },
        data: {
          hoursLogged: h.hoursLogged + p.durationMin / 60,
          lastPracticedAt: new Date(),
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: h.name,
          subtitle: `+${p.durationMin}dk • toplam ${updated.hoursLogged.toFixed(1)}sa`,
          icon: 'paintpalette.fill',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  list_hobbies: {
    name: 'list_hobbies',
    execute: async ({ userId }) => {
      const hobbies = await db.hobby.findMany({
        where: { userId, archived: false },
        orderBy: [{ lastPracticedAt: 'desc' }, { hoursLogged: 'desc' }],
      })
      return {
        ok: true,
        data: { hobbies, count: hobbies.length },
        display: {
          title: 'Hobiler',
          subtitle: `${hobbies.length}`,
          icon: 'paintpalette.fill',
          color: '#FF9F0A',
        },
      } satisfies ToolResult
    },
  },

  set_learning_goal: {
    name: 'set_learning_goal',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { skill: string }
      const g = await db.learningGoal.create({
        data: {
          userId,
          skill: p.skill,
          targetLevel: p.targetLevel as string | undefined,
          currentLevel: p.currentLevel as string | undefined,
          deadline: p.deadlineISO ? new Date(p.deadlineISO as string) : null,
          milestones: (p.milestones as string[] | undefined) ?? [],
        },
      })
      return {
        ok: true,
        data: g,
        display: {
          title: 'Öğrenme hedefi',
          subtitle: g.targetLevel ? `${g.skill} → ${g.targetLevel}` : g.skill,
          icon: 'flag.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  list_learning_goals: {
    name: 'list_learning_goals',
    execute: async ({ userId }) => {
      const goals = await db.learningGoal.findMany({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
      })
      return {
        ok: true,
        data: { goals, count: goals.length },
        display: {
          title: 'Öğrenme hedefleri',
          subtitle: `${goals.length}`,
          icon: 'flag.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  update_learning_milestone: {
    name: 'update_learning_milestone',
    execute: async ({ userId, params }) => {
      const p = params as {
        goalId: string
        currentLevel?: string
        addMilestone?: string
        achieved?: boolean
      }
      const g = await db.learningGoal.findFirst({ where: { id: p.goalId, userId } })
      if (!g) return { ok: false, error: 'not_found' }
      const data: Record<string, unknown> = {}
      if (p.currentLevel) data.currentLevel = p.currentLevel
      if (p.addMilestone) data.milestones = [...g.milestones, p.addMilestone]
      if (p.achieved) {
        data.status = 'achieved'
        data.achievedAt = new Date()
      }
      const updated = await db.learningGoal.update({ where: { id: p.goalId }, data })
      return {
        ok: true,
        data: updated,
        display: { title: g.skill, subtitle: 'Güncellendi', icon: 'flag.fill', color: '#5856D6' },
      } satisfies ToolResult
    },
  },

  add_note: {
    name: 'add_note',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { content: string }
      const n = await db.freeNote.create({
        data: {
          userId,
          content: p.content,
          title: p.title as string | undefined,
          source: p.source as string | undefined,
          sourceRef: p.sourceRef as string | undefined,
          tags: (p.tags as string[] | undefined) ?? [],
        },
      })
      return {
        ok: true,
        data: n,
        display: {
          title: 'Not kaydedildi',
          subtitle: n.title ?? n.content.slice(0, 40),
          icon: 'note.text',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  search_notes: {
    name: 'search_notes',
    execute: async ({ userId, params }) => {
      const { query } = params as { query: string }
      const notes = await db.freeNote.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
      return {
        ok: true,
        data: { notes, count: notes.length, query },
        display: {
          title: `"${query}"`,
          subtitle: `${notes.length} not`,
          icon: 'magnifyingglass',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_recent_notes: {
    name: 'list_recent_notes',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 30
      const since = new Date()
      since.setDate(since.getDate() - days)
      const notes = await db.freeNote.findMany({
        where: { userId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return {
        ok: true,
        data: { notes, count: notes.length },
        display: {
          title: 'Notlar',
          subtitle: `${notes.length}`,
          icon: 'note.text',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
}
