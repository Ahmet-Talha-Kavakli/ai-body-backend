import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { openai, AI_MODEL } from '@/lib/ai/client'

/**
 * GET /api/context/daily?date=YYYY-MM-DD
 *
 * Kullanıcının o günkü tüm verilerini tek sorguda döner.
 * Her sayfa (aktivite, supplement, uyku, beslenme vb.) bu endpoint'i kullanır.
 * İleride yeni veri tipleri buraya eklenir — her sayfa otomatik olarak beslenmiş olur.
 */
export const GET = withAuth(async (req: NextRequest, { user }) => {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const dayStart = new Date(`${date}T00:00:00.000Z`)
  const dayEnd = new Date(`${date}T23:59:59.999Z`)

  const [supplementLogs, activityLogs, sleepRecord, waterLog, readinessScore] = await Promise.all([
    db.supplementLog.findMany({
      where: { userId: user.id, date },
      include: {
        supplement: { select: { name: true, category: true, type: true, aiScore: true } },
      },
    }),
    db.activityLog.findMany({
      where: { userId: user.id, date },
      orderBy: { createdAt: 'asc' },
    }),
    db.sleepRecord.findFirst({
      where: { userId: user.id, recordedAt: { gte: dayStart, lte: dayEnd } },
      select: { duration: true, quality: true },
    }),
    db.waterLog.findFirst({
      where: { userId: user.id, date: { gte: dayStart, lte: dayEnd } },
      select: { amountMl: true },
    }),
    db.readinessScore.findFirst({
      where: { userId: user.id, recordedAt: { gte: dayStart, lte: dayEnd } },
      select: { score: true },
      orderBy: { recordedAt: 'desc' },
    }),
  ])

  const supplementSummary = supplementLogs.map((l) => l.supplement.name).join(', ') || null
  const totalActivityMinutes = activityLogs.reduce((sum, a) => sum + a.duration, 0)
  const activitySummary =
    activityLogs.length > 0
      ? activityLogs.map((a) => `${a.activityType} ${a.duration}dk ${a.intensity}`).join(', ')
      : null

  const activityTypes = activityLogs.map((a) => a.activityType)
  const hasContrastTherapy = activityTypes.includes('sauna') && activityTypes.includes('cold_pool')

  const aiContext = [
    supplementSummary && `Bugün alınan takviyeler: ${supplementSummary}`,
    activitySummary && `Bugünkü aktiviteler: ${activitySummary}`,
    sleepRecord &&
      `Uyku: ${Math.round((sleepRecord.duration / 60) * 10) / 10} saat, kalite: ${sleepRecord.quality}`,
    waterLog && `Su: ${waterLog.amountMl}ml`,
    readinessScore && `Hazırlık skoru: ${readinessScore.score}/100`,
    hasContrastTherapy &&
      'Kontrast terapi yapıldı (sauna + şok havuzu) — toparlanma etkisi bekleniyor',
  ]
    .filter(Boolean)
    .join('. ')

  return NextResponse.json({
    date,
    supplements: {
      logs: supplementLogs.map((l) => ({
        name: l.supplement.name,
        category: l.supplement.category,
        type: l.supplement.type,
        aiScore: l.supplement.aiScore,
        takenAt: l.takenAt,
      })),
      summary: supplementSummary,
    },
    activities: {
      logs: activityLogs,
      totalMinutes: totalActivityMinutes,
      summary: activitySummary,
      hasContrastTherapy,
    },
    sleep: sleepRecord
      ? {
          hours: Math.round((sleepRecord.duration / 60) * 10) / 10,
          quality: sleepRecord.quality,
        }
      : null,
    water: waterLog ? { amountMl: waterLog.amountMl } : null,
    readiness: readinessScore ? { score: readinessScore.score } : null,
    aiContext,
  })
})

/**
 * POST /api/context/daily/insight
 * Günlük bağlam bazında AI insight üretir.
 * focusOn: 'activity' | 'supplement' | 'general'
 */
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    date?: string
    focusOn?: 'activity' | 'supplement' | 'general'
  }
  const date = body.date ?? new Date().toISOString().slice(0, 10)
  const focusOn = body.focusOn ?? 'general'

  const dayStart = new Date(`${date}T00:00:00.000Z`)
  const dayEnd = new Date(`${date}T23:59:59.999Z`)

  const [supplementLogs, activityLogs, sleepRecord, readinessScore, basicProfile] =
    await Promise.all([
      db.supplementLog.findMany({
        where: { userId: user.id, date },
        include: { supplement: { select: { name: true, category: true } } },
      }),
      db.activityLog.findMany({ where: { userId: user.id, date } }),
      db.sleepRecord.findFirst({
        where: { userId: user.id, recordedAt: { gte: dayStart, lte: dayEnd } },
        select: { duration: true, quality: true },
      }),
      db.readinessScore.findFirst({
        where: { userId: user.id, recordedAt: { gte: dayStart, lte: dayEnd } },
        select: { score: true },
        orderBy: { recordedAt: 'desc' },
      }),
      db.userBasicProfile.findUnique({
        where: { userId: user.id },
        select: { primaryGoal: true, fitnessLevel: true },
      }),
    ])

  const contextLines = [
    supplementLogs.length &&
      `Takviyeler: ${supplementLogs.map((l) => l.supplement.name).join(', ')}`,
    activityLogs.length &&
      `Aktiviteler: ${activityLogs.map((a) => `${a.activityType} ${a.duration}dk`).join(', ')}`,
    sleepRecord && `Uyku: ${Math.round((sleepRecord.duration / 60) * 10) / 10}h`,
    readinessScore && `Hazırlık: ${readinessScore.score}/100`,
  ]
    .filter(Boolean)
    .join('\n')

  const focusPrompt = {
    activity:
      'Aktiviteler perspektifinden yorum yap. Aktivitelerin supplement kullanımıyla etkileşimini, toparlanmayı ve önerileri belirt.',
    supplement:
      'Takviyeler perspektifinden yorum yap. Supplementlerin bugünkü aktivitelerle etkileşimini ve etkisini belirt.',
    general: 'Genel günlük bağlamı değerlendir.',
  }[focusOn]

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Sen FitAI'nin kişisel sağlık koçusun. Kullanıcının bugünkü verilerine bakarak kısa, kişisel ve pratik bir yorum yap. ${focusPrompt} Max 2 cümle, Türkçe. Jenerik motivasyon cümlesi yazma — spesifik ol.`,
      },
      {
        role: 'user',
        content: `Hedef: ${basicProfile?.primaryGoal ?? '?'}, Seviye: ${basicProfile?.fitnessLevel ?? '?'}\nBugün (${date}):\n${contextLines || 'Henüz veri yok'}`,
      },
    ],
    max_tokens: 200,
    temperature: 0.4,
  })

  const insight = completion.choices[0]?.message?.content?.trim() ?? null
  return NextResponse.json({ insight, date, focusOn })
})
