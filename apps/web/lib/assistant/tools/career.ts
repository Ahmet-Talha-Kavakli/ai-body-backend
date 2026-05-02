/**
 * İş & Kariyer tool'ları (V2 Faz N).
 * CareerProfile, WorkProject, MeetingNote, JobApplication, Achievement, WorkContact, CareerGoal.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

const C = 'tools' as const

export const careerToolDefs: ToolDefinition[] = [
  // ── CAREER PROFILE ──
  {
    name: 'set_career_profile',
    category: C,
    description:
      'Kullanıcının kariyer profilini kaydet/güncelle. "Ben X şirketinde Y rolündeyim", "5 yıllık tecrübem var".',
    parameters: {
      type: 'object',
      properties: {
        currentRole: { type: 'string' },
        company: { type: 'string' },
        industry: { type: 'string' },
        yearsExperience: { type: 'number' },
        salaryAmount: { type: 'number' },
        salaryCurrency: { type: 'string' },
        employmentType: {
          type: 'string',
          enum: ['employed', 'contractor', 'founder', 'freelancer', 'unemployed', 'student'],
        },
        workMode: { type: 'string', enum: ['remote', 'hybrid', 'onsite'] },
        location: { type: 'string' },
      },
    },
  },
  {
    name: 'get_career_profile',
    category: C,
    description: 'Kullanıcının kariyer profilini getir.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'update_career_milestone',
    category: C,
    description:
      'Kariyer geçişi (terfi, iş değişikliği) — eski profili güncelle, achievement olarak kayıt da ekle.',
    parameters: {
      type: 'object',
      properties: {
        newRole: { type: 'string' },
        newCompany: { type: 'string' },
        newSalary: { type: 'number' },
        // promotion | new_job | career_change | exit
        kind: { type: 'string', enum: ['promotion', 'new_job', 'career_change', 'exit'] },
        note: { type: 'string' },
      },
      required: ['kind'],
    },
  },

  // ── WORK PROJECT ──
  {
    name: 'add_work_project',
    category: C,
    description:
      'İşle ilgili büyük bir proje ekle. "Acme Inc için website projesi başladı", "Q2 launch projesi".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        client: { type: 'string' },
        description: { type: 'string' },
        deadlineISO: { type: 'string' },
        budget: { type: 'number' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_work_projects',
    category: C,
    description: 'Aktif iş projelerini listele.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'paused', 'done', 'cancelled', 'archived', 'all'],
        },
      },
    },
  },
  {
    name: 'update_work_project',
    category: C,
    description: 'İş projesini güncelle (status, deadline, hours).',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        title: { type: 'string' },
        status: { type: 'string', enum: ['active', 'paused', 'done', 'cancelled'] },
        deadlineISO: { type: 'string' },
        hoursLogged: { type: 'number', description: 'Toplam loglu saat (delta değil, mutlak)' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'complete_work_project',
    category: C,
    description: 'Projeyi tamamla. Otomatik achievement kaydı oluşturulur.',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        impact: { type: 'string', description: 'Bu projenin etkisi/sonucu' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'archive_work_project',
    category: C,
    description: 'İş projesi arşivle.',
    parameters: {
      type: 'object',
      properties: { projectId: { type: 'string' } },
      required: ['projectId'],
    },
  },

  // ── MEETING ──
  {
    name: 'add_meeting_note',
    category: C,
    description:
      'Toplantı sonrası özet kaydet. "CEO ile Q2 budget toplantısı bitti", "1:1 manager ile" gibi.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        attendees: { type: 'array', items: { type: 'string' } },
        dateISO: { type: 'string', description: 'Default: şimdi' },
        agenda: { type: 'string' },
        decisions: { type: 'array', items: { type: 'string' } },
        actionItems: { type: 'array', items: { type: 'string' } },
        mood: { type: 'string', enum: ['good', 'neutral', 'tense', 'bad'] },
        notes: { type: 'string' },
        calendarEventId: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_recent_meetings',
    category: C,
    description: 'Son N gündeki toplantı notları.',
    parameters: {
      type: 'object',
      properties: { days: { type: 'number', default: 30 } },
    },
  },
  {
    name: 'search_meetings',
    category: C,
    description: 'Toplantıları başlığa, katılımcıya veya nota göre ara.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
    },
  },

  // ── JOB APPLICATIONS ──
  {
    name: 'add_job_application',
    category: C,
    description: 'Yeni iş başvurusu kaydet. "Acme PM rolüne başvurdum", "X firmasına apply ettim".',
    parameters: {
      type: 'object',
      properties: {
        company: { type: 'string' },
        role: { type: 'string' },
        source: { type: 'string', description: 'linkedin, referral, cold_apply, recruiter' },
        salaryRange: { type: 'string' },
        location: { type: 'string' },
        workMode: { type: 'string', enum: ['remote', 'hybrid', 'onsite'] },
        link: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['company', 'role'],
    },
  },
  {
    name: 'update_job_status',
    category: C,
    description: 'Bir başvurunun durumunu güncelle. "Acme 2. mülakata çağırdı", "X reddetti".',
    parameters: {
      type: 'object',
      properties: {
        applicationId: { type: 'string' },
        status: {
          type: 'string',
          enum: [
            'applied',
            'screening',
            'interview_1',
            'interview_2',
            'interview_final',
            'offer',
            'accepted',
            'rejected',
            'withdrawn',
          ],
        },
        notes: { type: 'string' },
      },
      required: ['applicationId', 'status'],
    },
  },
  {
    name: 'list_job_applications',
    category: C,
    description: 'Aktif iş başvurularını listele.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            'applied',
            'screening',
            'interview_1',
            'interview_2',
            'interview_final',
            'offer',
            'all',
          ],
        },
      },
    },
  },

  // ── ACHIEVEMENT ──
  {
    name: 'add_achievement',
    category: C,
    description:
      'Bir başarı/övgü kaydet. "Manager harika iş dedi", "X feature shipped", "Y award aldım".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        type: {
          type: 'string',
          enum: [
            'recognition',
            'milestone',
            'promotion',
            'award',
            'feature_shipped',
            'revenue',
            'learning',
            'other',
          ],
        },
        description: { type: 'string' },
        impact: { type: 'string' },
        dateISO: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_achievements',
    category: C,
    description:
      'Başarıları listele. Yıllık değerlendirme, performans review, kariyer özeti için kullan.',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', default: 365 },
        type: { type: 'string' },
      },
    },
  },

  // ── WORK CONTACTS ──
  {
    name: 'add_work_contact',
    category: C,
    description:
      'İş ağında biri ekle. "Mehmet PM, Acme\'de tanıştık", "LinkedIn\'de bağlandığım recruiter".',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        role: { type: 'string' },
        company: { type: 'string' },
        relation: {
          type: 'string',
          enum: [
            'friend',
            'peer',
            'mentor',
            'manager',
            'ex_colleague',
            'recruiter',
            'client',
            'candidate',
          ],
        },
        importance: { type: 'number', description: '0-10' },
        linkedin: { type: 'string' },
        email: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'list_work_contacts',
    category: C,
    description:
      'İş ağı kişilerini listele. Genelde lastContactAt + importance göre sıralanır → AI haftalık "şununla 4 aydır konuşmadın" der.',
    parameters: {
      type: 'object',
      properties: {
        relation: { type: 'string' },
        sortBy: { type: 'string', enum: ['lastContactAt', 'importance'], default: 'lastContactAt' },
      },
    },
  },
  {
    name: 'note_contact_interaction',
    category: C,
    description:
      'Bir iş kontağı ile yeni etkileşimi kaydet. lastContactAt güncellenir, isteğe bağlı not eklenir.',
    parameters: {
      type: 'object',
      properties: {
        contactId: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['contactId'],
    },
  },

  // ── CAREER GOAL ──
  {
    name: 'set_career_goal',
    category: C,
    description:
      'Kariyer hedefi koy. "VP olmak istiyorum 3 yılda", "$200k maaş", "kendi şirketim".',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        targetRole: { type: 'string' },
        targetSalary: { type: 'number' },
        targetCurrency: { type: 'string' },
        horizon: { type: 'string', enum: ['6-month', '1-year', '3-year', '5-year'] },
        deadlineISO: { type: 'string' },
        milestones: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_career_goals',
    category: C,
    description: 'Kariyer hedeflerini listele.',
    parameters: { type: 'object', properties: {} },
  },
]

// ────────────────────────────────────────────────────
// EXECUTORS
// ────────────────────────────────────────────────────

export const careerExecutors: Record<string, ToolExecutor> = {
  set_career_profile: {
    name: 'set_career_profile',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown>
      const profile = await db.careerProfile.upsert({
        where: { userId },
        create: { userId, ...(p as object) },
        update: p as object,
      })
      return {
        ok: true,
        data: profile,
        display: {
          title: 'Kariyer profili güncellendi',
          subtitle: profile.currentRole ?? profile.company ?? '—',
          icon: 'briefcase.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  get_career_profile: {
    name: 'get_career_profile',
    execute: async ({ userId }) => {
      const profile = await db.careerProfile.findUnique({ where: { userId } })
      if (!profile) {
        return {
          ok: false,
          error: 'no_profile',
          display: { title: 'Kariyer profili yok', icon: 'briefcase', color: '#8E8E93' },
        }
      }
      return {
        ok: true,
        data: profile,
        display: {
          title: profile.currentRole ?? 'Profilin',
          subtitle: profile.company ?? '—',
          icon: 'briefcase.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  update_career_milestone: {
    name: 'update_career_milestone',
    execute: async ({ userId, params }) => {
      const p = params as {
        kind: string
        newRole?: string
        newCompany?: string
        newSalary?: number
        note?: string
      }
      const profile = await db.careerProfile.upsert({
        where: { userId },
        create: {
          userId,
          currentRole: p.newRole,
          company: p.newCompany,
          salaryAmount: p.newSalary,
        },
        update: {
          currentRole: p.newRole ?? undefined,
          company: p.newCompany ?? undefined,
          salaryAmount: p.newSalary ?? undefined,
        },
      })
      // Achievement de oluştur
      const titleMap: Record<string, string> = {
        promotion: 'Terfi aldım',
        new_job: 'Yeni iş',
        career_change: 'Kariyer değişimi',
        exit: 'İşten ayrılış',
      }
      await db.achievement.create({
        data: {
          userId,
          title: titleMap[p.kind] ?? 'Kariyer geçişi',
          type: 'promotion',
          description: p.note,
        },
      })
      return {
        ok: true,
        data: profile,
        display: {
          title: titleMap[p.kind] ?? 'Geçiş',
          subtitle: profile.currentRole ?? '—',
          icon: 'arrow.up.right.circle.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  add_work_project: {
    name: 'add_work_project',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        client?: string
        description?: string
        deadlineISO?: string
        budget?: number
      }
      const proj = await db.workProject.create({
        data: {
          userId,
          title: p.title,
          client: p.client,
          description: p.description,
          deadline: p.deadlineISO ? new Date(p.deadlineISO) : null,
          budget: p.budget,
          startedAt: new Date(),
        },
      })
      return {
        ok: true,
        data: proj,
        display: {
          title: 'Proje başlatıldı',
          subtitle: p.client ? `${p.title} • ${p.client}` : p.title,
          icon: 'briefcase.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_work_projects: {
    name: 'list_work_projects',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string }
      const where: Record<string, unknown> = { userId, archived: false }
      if (p?.status && p.status !== 'all') where.status = p.status
      const projects = await db.workProject.findMany({
        where,
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
      })
      return {
        ok: true,
        data: { projects, count: projects.length },
        display: {
          title: 'İş projeleri',
          subtitle: `${projects.length} proje`,
          icon: 'briefcase.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  update_work_project: {
    name: 'update_work_project',
    execute: async ({ userId, params }) => {
      const p = params as Record<string, unknown> & { projectId: string }
      const proj = await db.workProject.findFirst({ where: { id: p.projectId, userId } })
      if (!proj) return { ok: false, error: 'not_found' }
      const data: Record<string, unknown> = {}
      if (p.title) data.title = p.title
      if (p.status) data.status = p.status
      if (p.deadlineISO) data.deadline = new Date(p.deadlineISO as string)
      if (typeof p.hoursLogged === 'number') data.hoursLogged = p.hoursLogged
      const updated = await db.workProject.update({ where: { id: p.projectId }, data })
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

  complete_work_project: {
    name: 'complete_work_project',
    execute: async ({ userId, params }) => {
      const p = params as { projectId: string; impact?: string }
      const proj = await db.workProject.findFirst({ where: { id: p.projectId, userId } })
      if (!proj) return { ok: false, error: 'not_found' }
      const updated = await db.workProject.update({
        where: { id: p.projectId },
        data: { status: 'done', completedAt: new Date() },
      })
      // Otomatik achievement
      await db.achievement.create({
        data: {
          userId,
          title: `Proje tamamlandı: ${proj.title}`,
          type: 'milestone',
          description: proj.client ? `Client: ${proj.client}` : null,
          impact: p.impact,
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: 'Proje tamamlandı',
          subtitle: proj.title,
          icon: 'checkmark.seal.fill',
          color: '#30D158',
        },
      } satisfies ToolResult
    },
  },

  archive_work_project: {
    name: 'archive_work_project',
    execute: async ({ userId, params }) => {
      const { projectId } = params as { projectId: string }
      const proj = await db.workProject.findFirst({ where: { id: projectId, userId } })
      if (!proj) return { ok: false, error: 'not_found' }
      await db.workProject.update({ where: { id: projectId }, data: { archived: true } })
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

  add_meeting_note: {
    name: 'add_meeting_note',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        attendees?: string[]
        dateISO?: string
        agenda?: string
        decisions?: string[]
        actionItems?: string[]
        mood?: string
        notes?: string
        calendarEventId?: string
      }
      const note = await db.meetingNote.create({
        data: {
          userId,
          title: p.title,
          attendees: p.attendees ?? [],
          date: p.dateISO ? new Date(p.dateISO) : new Date(),
          agenda: p.agenda,
          decisions: p.decisions ?? [],
          actionItems: p.actionItems ?? [],
          mood: p.mood,
          notes: p.notes,
          calendarEventId: p.calendarEventId,
        },
      })
      return {
        ok: true,
        data: note,
        display: {
          title: 'Toplantı kaydedildi',
          subtitle: p.title,
          icon: 'rectangle.on.rectangle.angled',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_recent_meetings: {
    name: 'list_recent_meetings',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number }
      const days = p?.days ?? 30
      const since = new Date()
      since.setDate(since.getDate() - days)
      const meetings = await db.meetingNote.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'desc' },
        take: 30,
      })
      return {
        ok: true,
        data: { meetings, count: meetings.length },
        display: {
          title: `Son ${days} gün toplantı`,
          subtitle: `${meetings.length} adet`,
          icon: 'rectangle.on.rectangle.angled',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  search_meetings: {
    name: 'search_meetings',
    execute: async ({ userId, params }) => {
      const { query } = params as { query: string }
      const meetings = await db.meetingNote.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
            { agenda: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { date: 'desc' },
        take: 30,
      })
      return {
        ok: true,
        data: { meetings, count: meetings.length, query },
        display: {
          title: `"${query}"`,
          subtitle: `${meetings.length} toplantı`,
          icon: 'magnifyingglass',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  add_job_application: {
    name: 'add_job_application',
    execute: async ({ userId, params }) => {
      const p = params as {
        company: string
        role: string
        source?: string
        salaryRange?: string
        location?: string
        workMode?: string
        link?: string
        notes?: string
      }
      const app = await db.jobApplication.create({
        data: {
          userId,
          company: p.company,
          role: p.role,
          source: p.source,
          salaryRange: p.salaryRange,
          location: p.location,
          workMode: p.workMode,
          link: p.link,
          notes: p.notes,
        },
      })
      return {
        ok: true,
        data: app,
        display: {
          title: `${p.company} başvurusu`,
          subtitle: p.role,
          icon: 'paperplane.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  update_job_status: {
    name: 'update_job_status',
    execute: async ({ userId, params }) => {
      const p = params as { applicationId: string; status: string; notes?: string }
      const app = await db.jobApplication.findFirst({ where: { id: p.applicationId, userId } })
      if (!app) return { ok: false, error: 'not_found' }
      const updated = await db.jobApplication.update({
        where: { id: p.applicationId },
        data: { status: p.status, notes: p.notes ?? app.notes },
      })
      // Accepted ise otomatik achievement
      if (p.status === 'accepted') {
        await db.achievement.create({
          data: {
            userId,
            title: `${app.company} - ${app.role} kabul`,
            type: 'milestone',
            description: 'Yeni iş teklifi kabul edildi',
          },
        })
      }
      return {
        ok: true,
        data: updated,
        display: {
          title: `${app.company} → ${p.status}`,
          subtitle: app.role,
          icon: p.status === 'rejected' ? 'xmark.circle' : 'arrow.right.circle.fill',
          color: p.status === 'rejected' ? '#FF453A' : '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_job_applications: {
    name: 'list_job_applications',
    execute: async ({ userId, params }) => {
      const p = params as { status?: string }
      const where: Record<string, unknown> = { userId, archived: false }
      if (p?.status && p.status !== 'all') where.status = p.status
      const apps = await db.jobApplication.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
      })
      return {
        ok: true,
        data: { applications: apps, count: apps.length },
        display: {
          title: 'Başvurular',
          subtitle: `${apps.length}`,
          icon: 'paperplane.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  add_achievement: {
    name: 'add_achievement',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        type?: string
        description?: string
        impact?: string
        dateISO?: string
      }
      const a = await db.achievement.create({
        data: {
          userId,
          title: p.title,
          type: p.type ?? 'milestone',
          description: p.description,
          impact: p.impact,
          date: p.dateISO ? new Date(p.dateISO) : new Date(),
        },
      })
      return {
        ok: true,
        data: a,
        display: {
          title: 'Başarı kaydedildi',
          subtitle: p.title,
          icon: 'star.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  list_achievements: {
    name: 'list_achievements',
    execute: async ({ userId, params }) => {
      const p = params as { days?: number; type?: string }
      const days = p?.days ?? 365
      const since = new Date()
      since.setDate(since.getDate() - days)
      const where: Record<string, unknown> = { userId, date: { gte: since } }
      if (p?.type) where.type = p.type
      const achievements = await db.achievement.findMany({
        where,
        orderBy: { date: 'desc' },
        take: 100,
      })
      return {
        ok: true,
        data: { achievements, count: achievements.length },
        display: {
          title: `Son ${days} gün başarı`,
          subtitle: `${achievements.length} kayıt`,
          icon: 'star.fill',
          color: '#FFD60A',
        },
      } satisfies ToolResult
    },
  },

  add_work_contact: {
    name: 'add_work_contact',
    execute: async ({ userId, params }) => {
      const p = params as {
        name: string
        role?: string
        company?: string
        relation?: string
        importance?: number
        linkedin?: string
        email?: string
        notes?: string
      }
      const wc = await db.workContact.create({
        data: {
          userId,
          name: p.name,
          role: p.role,
          company: p.company,
          relation: p.relation ?? 'peer',
          importance: p.importance ?? 5,
          linkedin: p.linkedin,
          email: p.email,
          notes: p.notes,
          lastContactAt: new Date(),
        },
      })
      return {
        ok: true,
        data: wc,
        display: {
          title: 'Network kaydedildi',
          subtitle: p.role ? `${p.name} • ${p.role}` : p.name,
          icon: 'person.crop.circle.badge.plus',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  list_work_contacts: {
    name: 'list_work_contacts',
    execute: async ({ userId, params }) => {
      const p = params as { relation?: string; sortBy?: string }
      const where: Record<string, unknown> = { userId, archived: false }
      if (p?.relation) where.relation = p.relation
      const orderBy =
        p?.sortBy === 'importance'
          ? [{ importance: 'desc' as const }]
          : [{ lastContactAt: 'asc' as const }, { importance: 'desc' as const }]
      const contacts = await db.workContact.findMany({ where, orderBy, take: 100 })
      return {
        ok: true,
        data: { contacts, count: contacts.length },
        display: {
          title: 'İş ağı',
          subtitle: `${contacts.length} kişi`,
          icon: 'person.3.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  note_contact_interaction: {
    name: 'note_contact_interaction',
    execute: async ({ userId, params }) => {
      const p = params as { contactId: string; note?: string }
      const c = await db.workContact.findFirst({ where: { id: p.contactId, userId } })
      if (!c) return { ok: false, error: 'not_found' }
      const updated = await db.workContact.update({
        where: { id: p.contactId },
        data: {
          lastContactAt: new Date(),
          notes: p.note
            ? `${c.notes ? c.notes + '\n' : ''}[${new Date().toISOString().slice(0, 10)}] ${p.note}`
            : c.notes,
        },
      })
      return {
        ok: true,
        data: updated,
        display: {
          title: `${c.name} ile iletişim`,
          subtitle: 'Network güncellendi',
          icon: 'message.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },

  set_career_goal: {
    name: 'set_career_goal',
    execute: async ({ userId, params }) => {
      const p = params as {
        title: string
        targetRole?: string
        targetSalary?: number
        targetCurrency?: string
        horizon?: string
        deadlineISO?: string
        milestones?: string[]
      }
      const g = await db.careerGoal.create({
        data: {
          userId,
          title: p.title,
          targetRole: p.targetRole,
          targetSalary: p.targetSalary,
          targetCurrency: p.targetCurrency,
          horizon: p.horizon,
          deadline: p.deadlineISO ? new Date(p.deadlineISO) : null,
          milestones: p.milestones ?? [],
        },
      })
      return {
        ok: true,
        data: g,
        display: {
          title: 'Kariyer hedefi',
          subtitle: p.title,
          icon: 'flag.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },

  list_career_goals: {
    name: 'list_career_goals',
    execute: async ({ userId }) => {
      const goals = await db.careerGoal.findMany({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
      })
      return {
        ok: true,
        data: { goals, count: goals.length },
        display: {
          title: 'Kariyer hedefleri',
          subtitle: `${goals.length}`,
          icon: 'flag.fill',
          color: '#5856D6',
        },
      } satisfies ToolResult
    },
  },
}
