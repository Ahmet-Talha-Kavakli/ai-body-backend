import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    // Fetch today's data in parallel
    const [waterLog, sleepRecord, workoutCount] = await Promise.all([
      db.waterLog.findUnique({
        where: {
          userId_date: {
            userId: user.id,
            date: todayStart,
          },
        },
        select: { amountMl: true, glasses: true },
      }),
      db.sleepRecord.findFirst({
        where: {
          userId: user.id,
          recordedAt: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { recordedAt: 'desc' },
        select: { duration: true, quality: true },
      }),
      db.workoutSession.count({
        where: {
          userId: user.id,
          startedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
    ])

    const hour = now.getHours()
    const greeting = hour < 12 ? 'Günaydın' : hour < 17 ? 'İyi öğleden sonralar' : 'İyi akşamlar'
    const firstName = user.name?.split(' ')[0] ?? 'kullanıcı'

    // Build context for AI prompt
    const contextParts: string[] = []
    if (waterLog) {
      contextParts.push(`Bugün ${Math.round(waterLog.amountMl)} ml su içti`)
    }
    if (sleepRecord) {
      const sleepHours = (sleepRecord.duration / 60).toFixed(1)
      contextParts.push(
        `Dün gece ${sleepHours} saat uyudu (kalite: ${Math.round(sleepRecord.quality)}/100)`
      )
    }
    if (workoutCount > 0) {
      contextParts.push(`Bugün ${workoutCount} antrenman yaptı`)
    }
    const context = contextParts.length > 0 ? contextParts.join(', ') + '.' : ''

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Sen FitAI uygulamasının AI koçusun. Kısa, motive edici, samimi Türkçe mesajlar yazıyorsun. Maksimum 2 cümle.',
        },
        {
          role: 'user',
          content: `Kullanıcı adı: ${firstName}. Saat: ${hour}:00. ${context} Kısa, kişisel bir karşılama mesajı yaz.`,
        },
      ],
      max_tokens: 100,
      temperature: 0.8,
    })

    const message =
      completion.choices[0]?.message?.content ??
      `${greeting}, ${firstName}! Bugün de harika bir gün olacak.`

    return NextResponse.json({
      greeting,
      firstName,
      message,
      hour,
      stats: {
        waterMl: waterLog?.amountMl ?? 0,
        sleepHours: sleepRecord ? +(sleepRecord.duration / 60).toFixed(1) : null,
        workoutCount,
      },
    })
  } catch {
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Günaydın' : hour < 17 ? 'İyi öğleden sonralar' : 'İyi akşamlar'
    return NextResponse.json({
      greeting,
      firstName: user.name?.split(' ')[0] ?? 'kullanıcı',
      message: `${greeting}! Bugün de harika bir gün olacak. 💪`,
      hour,
      stats: { waterMl: 0, sleepHours: null, workoutCount: 0 },
    })
  }
})
