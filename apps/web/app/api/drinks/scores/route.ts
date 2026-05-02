import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { openai, AI_MODEL } from '@/lib/ai/client'

export const maxDuration = 300

const BATCH_SIZE = 10

type ScoreResult = {
  id: string
  score: 'green' | 'yellow' | 'red'
  aiNote: string
  benefits?: string
  cautions?: string
  bestTime?: string
  dailyLimit?: string
}

async function scoreBatch(
  items: {
    id: string
    drinkType: string
    nametr: string
    category: string
    hydrationValue: number
    caffeinePerServing: number | null
    sugarPerServing: number | null
  }[],
  profileSummary: string
): Promise<ScoreResult[]> {
  const itemsText = items
    .map(
      (i) =>
        `ID:${i.id} | ${i.nametr} [${i.category}] Hidrasyon:${Math.round(i.hydrationValue * 100)}% Kafein:${i.caffeinePerServing ?? 0}mg Şeker:${i.sugarPerServing ?? 0}g`
    )
    .join('\n')

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Sen bir beslenme uzmanı ve sporcu diyetisyenisin. Kullanıcı profiline göre her içecek için kişiselleştirilmiş hidrasyon değerlendirmesi yap.

JSON formatında yanıt ver:
{"scores":[{
  "id":"...",
  "score":"green|yellow|red",
  "aiNote":"max 100 karakter, Türkçe, kişisel ve spesifik",
  "benefits":"bu içeceğin bu kullanıcıya özel faydaları, max 100 karakter",
  "cautions":"varsa dikkat edilecekler, max 100 karakter, yoksa boş string",
  "bestTime":"en iyi içilecek zaman (ör: Sabah aç karnına, Antrenman öncesi), max 50 karakter",
  "dailyLimit":"önerilen günlük limit (ör: Günde max 2 bardak), max 50 karakter"
}]}

- green: bu kullanıcı için çok uygun ve tavsiye edilir
- yellow: içebilir ama miktara dikkat etmeli
- red: bu kullanıcı için şu an önerilmez`,
      },
      {
        role: 'user',
        content: `Kullanıcı Profili: ${profileSummary}\n\nSkorlanacak İçecekler:\n${itemsText}`,
      },
    ],
    max_tokens: 3000,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const result = JSON.parse(raw) as { scores?: ScoreResult[] }
  return result.scores ?? []
}

export const POST = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [basicProfile, injuries, catalog, existingScores] = await Promise.all([
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
      db.drinkCatalog.findMany({ orderBy: { category: 'asc' } }),
      db.userDrinkScore.findMany({
        where: { userId: user.id },
        select: { catalogId: true, updatedAt: true },
      }),
    ])

    const scoreMap = new Map(existingScores.map((s) => [s.catalogId, s.updatedAt]))
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

    const batches: (typeof toScore)[] = []
    for (let i = 0; i < toScore.length; i += BATCH_SIZE)
      batches.push(toScore.slice(i, i + BATCH_SIZE))

    const allScores: ScoreResult[] = []
    for (const batch of batches) {
      const scores = await scoreBatch(batch, profileSummary)
      allScores.push(...scores)
    }

    await Promise.all(
      allScores.map((s) =>
        db.userDrinkScore.upsert({
          where: { userId_catalogId: { userId: user.id, catalogId: s.id } },
          create: {
            userId: user.id,
            catalogId: s.id,
            score: s.score,
            aiNote: s.aiNote,
            benefits: s.benefits,
            cautions: s.cautions,
            bestTime: s.bestTime,
            dailyLimit: s.dailyLimit,
          },
          update: {
            score: s.score,
            aiNote: s.aiNote,
            benefits: s.benefits,
            cautions: s.cautions,
            bestTime: s.bestTime,
            dailyLimit: s.dailyLimit,
            updatedAt: new Date(),
          },
        })
      )
    )

    return NextResponse.json({ message: 'Scores updated', count: allScores.length })
  } catch (error) {
    console.error('[drinks scores POST]', error)
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
})

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const scores = await db.userDrinkScore.findMany({
    where: { userId: user.id },
    include: { catalog: { select: { drinkType: true } } },
  })

  return NextResponse.json({
    scores: Object.fromEntries(
      scores.map((s) => [
        s.catalog.drinkType,
        {
          score: s.score,
          aiNote: s.aiNote,
          benefits: s.benefits,
          cautions: s.cautions,
          bestTime: s.bestTime,
          dailyLimit: s.dailyLimit,
        },
      ])
    ),
    count: scores.length,
  })
})
