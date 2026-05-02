import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { openai, AI_MODEL } from '@/lib/ai/client'

export const maxDuration = 300

const BATCH_SIZE = 20

type ScoreResult = {
  id: string
  score: 'green' | 'yellow' | 'red'
  aiNote: string
  benefits?: string
  cautions?: string
  frequency?: string
  bestTime?: string
}

async function scoreBatch(
  items: { id: string; activityType: string; nametr: string; category: string; metValue: number }[],
  profileSummary: string,
  city: string,
  recentSupplements: string
): Promise<ScoreResult[]> {
  const itemsText = items
    .map((i) => `ID:${i.id} | ${i.nametr} [${i.category}] MET:${i.metValue}`)
    .join('\n')

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Sen bir spor hekimi ve fitness uzmanısın. Kullanıcı profiline, bulunduğu şehre ve aldığı takviyalere göre her aktivite için kişiselleştirilmiş değerlendirme yap.

JSON formatında yanıt ver:
{"scores":[{
  "id":"...",
  "score":"green|yellow|red",
  "aiNote":"max 100 karakter, Türkçe, kişisel ve spesifik değerlendirme",
  "benefits":"bu aktivitenin bu kullanıcıya özel faydaları, max 100 karakter",
  "cautions":"varsa dikkat edilecekler (sakatlık, sağlık durumu bazlı), max 100 karakter, yoksa boş string",
  "frequency":"ideal haftalık sıklık (ör: Haftada 3-4x ideal), max 50 karakter",
  "bestTime":"en iyi yapılacağı zaman (ör: Sabah aç karnına, Akşam üzeri), max 50 karakter"
}]}

- green: bu kullanıcı için çok uygun ve tavsiye edilir
- yellow: yapabilir ama dikkat etmeli
- red: bu kullanıcı için şu an önerilmez (sakatlık, sağlık durumu vb.)`,
      },
      {
        role: 'user',
        content: `Kullanıcı Profili: ${profileSummary}\nŞehir/İklim: ${city}\nAldığı Takviyeler (bugün): ${recentSupplements}\n\nSkorlanacak Aktiviteler:\n${itemsText}`,
      },
    ],
    max_tokens: 4000,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const result = JSON.parse(raw) as { scores?: ScoreResult[] }
  return result.scores ?? []
}

export const POST = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [basicProfile, injuries, todaySupps, catalog, existingScores] = await Promise.all([
      db.userBasicProfile.findUnique({
        where: { userId: user.id },
        select: {
          age: true,
          gender: true,
          weight: true,
          height: true,
          primaryGoal: true,
          fitnessLevel: true,
        },
      }),
      db.injury.findMany({
        where: { userId: user.id, isActive: true },
        select: { bodyPart: true, severity: true },
      }),
      db.supplementLog.findMany({
        where: { userId: user.id, date: today },
        include: { supplement: { select: { name: true } } },
      }),
      db.activityCatalog.findMany({ orderBy: { category: 'asc' } }),
      db.userActivityScore.findMany({
        where: { userId: user.id },
        select: { catalogId: true, updatedAt: true },
      }),
    ])

    const scoreMap = new Map(existingScores.map((s) => [s.catalogId, s.updatedAt]))

    // Hiç skoru olmayan veya 7 günden eski olanları skorla
    const toScore = catalog.filter((c) => {
      const scored = scoreMap.get(c.id)
      return !scored || scored < oneWeekAgo
    })

    if (toScore.length === 0) {
      return NextResponse.json({ message: 'Scores are up to date', fresh: true })
    }

    const profileSummary = basicProfile
      ? `Yaş:${basicProfile.age ?? '?'}, Cinsiyet:${basicProfile.gender ?? '?'}, Ağırlık:${basicProfile.weight ?? '?'}kg, Hedef:${basicProfile.primaryGoal ?? '?'}, Seviye:${basicProfile.fitnessLevel ?? '?'}${injuries.length ? `, Sakatlıklar:${injuries.map((i) => `${i.bodyPart}(${i.severity})`).join('/')}` : ''}`
      : 'Profil bilgisi yok'

    const city = user.country ?? 'Türkiye'
    const recentSupplements = todaySupps.map((l) => l.supplement.name).join(', ') || 'yok'

    const batches: (typeof toScore)[] = []
    for (let i = 0; i < toScore.length; i += BATCH_SIZE)
      batches.push(toScore.slice(i, i + BATCH_SIZE))

    const allScores: ScoreResult[] = []
    for (const batch of batches) {
      const scores = await scoreBatch(batch, profileSummary, city, recentSupplements)
      allScores.push(...scores)
    }

    await Promise.all(
      allScores.map((s) =>
        db.userActivityScore.upsert({
          where: { userId_catalogId: { userId: user.id, catalogId: s.id } },
          create: {
            userId: user.id,
            catalogId: s.id,
            score: s.score,
            aiNote: s.aiNote,
            benefits: s.benefits,
            cautions: s.cautions,
            frequency: s.frequency,
            bestTime: s.bestTime,
          },
          update: {
            score: s.score,
            aiNote: s.aiNote,
            benefits: s.benefits,
            cautions: s.cautions,
            frequency: s.frequency,
            bestTime: s.bestTime,
            updatedAt: new Date(),
          },
        })
      )
    )

    return NextResponse.json({ message: 'Scores updated', count: allScores.length })
  } catch (error) {
    console.error('[activity score-catalog POST]', error)
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
})

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const scores = await db.userActivityScore.findMany({
    where: { userId: user.id },
    select: {
      catalogId: true,
      score: true,
      aiNote: true,
      benefits: true,
      cautions: true,
      frequency: true,
      bestTime: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({
    scores: Object.fromEntries(scores.map((s) => [s.catalogId, s])),
    scoredAt: scores[0]?.updatedAt ?? null,
    count: scores.length,
  })
})
