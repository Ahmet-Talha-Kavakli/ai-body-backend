import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// GET — kullanıcının roadmap'ini getir
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const roadmap = await db.roadmap.findUnique({
      where: { userId: user.id },
      include: {
        weeks: {
          include: { tasks: { orderBy: { order: 'asc' } } },
          orderBy: { weekNumber: 'asc' },
        },
      },
    })

    if (!roadmap) return NextResponse.json(null)
    return NextResponse.json(roadmap)
  } catch (err) {
    console.error('[roadmap GET] error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
})

// POST — yeni roadmap oluştur (AI ile)
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => ({}))
    const type: string = body.type ?? 'fitness'

    // Mevcut profil bilgisi
    const profile = await db.userBasicProfile.findUnique({ where: { userId: user.id } })

    const prompt = `Sen bir fitness koçusun. Kullanıcı için 8 haftalık kişisel bir yol haritası oluştur.
Kullanıcı hedefi: ${profile?.primaryGoal ?? 'Genel fitness'}
Fitness seviyesi: ${profile?.fitnessLevel ?? 'Başlangıç'}
Yol haritası tipi: ${type}

JSON formatında döndür:
{
  "title": "Yol haritası başlığı",
  "weeks": [
    {
      "weekNumber": 1,
      "title": "Hafta başlığı",
      "description": "Kısa açıklama",
      "tasks": [
        {"title": "Görev açıklaması", "order": 0},
        {"title": "Görev açıklaması", "order": 1}
      ]
    }
  ]
}

8 hafta, her haftada 3-5 görev. Türkçe. Gerçekçi ve motive edici.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })

    const generated = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
      title: string
      weeks: Array<{
        weekNumber: number
        title: string
        description?: string
        tasks: Array<{ title: string; order: number }>
      }>
    }

    // Mevcut roadmap varsa sil
    await db.roadmap.deleteMany({ where: { userId: user.id } })

    // Yeni roadmap oluştur
    const roadmap = await db.roadmap.create({
      data: {
        userId: user.id,
        type,
        title: generated.title ?? 'Kişisel Yol Haritam',
        weeks: {
          create: (generated.weeks ?? []).map((w, i) => ({
            weekNumber: w.weekNumber ?? i + 1,
            title: w.title,
            description: w.description,
            isUnlocked: i === 0, // Sadece ilk hafta açık başlar
            tasks: {
              create: (w.tasks ?? []).map((t) => ({
                title: t.title,
                order: t.order,
              })),
            },
          })),
        },
      },
      include: {
        weeks: {
          include: { tasks: { orderBy: { order: 'asc' } } },
          orderBy: { weekNumber: 'asc' },
        },
      },
    })

    return NextResponse.json(roadmap)
  } catch (err) {
    console.error('[roadmap POST] error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
})
