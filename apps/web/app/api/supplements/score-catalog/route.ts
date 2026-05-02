import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { openai, AI_MODEL } from '@/lib/ai/client'

export const maxDuration = 300 // 5 dakika timeout (Vercel Pro gerektirir, local'de sınırsız)

const BATCH_SIZE = 25 // Küçük batch = daha hızlı yanıt, daha az rate limit riski

type ScoreResult = {
  id: string
  score: 'green' | 'yellow' | 'red'
  aiNote: string
  timing?: string
  interactions?: string
  allergens?: string
  alternatives?: string
  evidenceLevel?: string
}

async function scoreBatch(
  items: {
    id: string
    name: string
    category: string
    doseInfo: string | null
    benefit: string | null
  }[],
  profileSummary: string,
  existingSuppsText: string
): Promise<ScoreResult[]> {
  const itemsText = items
    .map((i) => `ID:${i.id} | ${i.name} [${i.category}]${i.doseInfo ? ` - ${i.doseInfo}` : ''}`)
    .join('\n')

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: 'system',
        content: `Sen bir klinik beslenme uzmanısın. Kullanıcı profiline ve mevcut supplementlere göre her ürün için detaylı değerlendirme yap.

JSON formatında yanıt ver:
{"scores":[{
  "id":"...",
  "score":"green|yellow|red",
  "aiNote":"max 100 karakter, Türkçe, kişisel değerlendirme",
  "timing":"ne zaman alınmalı, max 50 karakter (ör: Sabah aç karnına, Antrenman öncesi)",
  "interactions":"varsa ilaç/supplement etkileşimleri, virgülle ayrılmış max 3 madde, yoksa boş string",
  "allergens":"varsa alerjen uyarıları, virgülle ayrılmış, yoksa boş string (ör: Gluten, Soya, Süt türevleri)",
  "alternatives":"benzer 2 alternatif supplement ismi, virgülle ayrılmış (KESİNLİKLE skorlanan ürünün kendisini veya çok benzer varyantını yazma)",
  "evidenceLevel":"Kuvvetli veya Orta veya Zayıf"
}]}

- green: güvenli ve faydalı
- yellow: dikkat gerektiren
- red: bu kullanıcı için önerilmez`,
      },
      {
        role: 'user',
        content: `Kullanıcı Profili: ${profileSummary}\nMevcut Supplementler: ${existingSuppsText}\n\nSkorlanacak Ürünler:\n${itemsText}`,
      },
    ],
    max_tokens: 6000,
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  const result = JSON.parse(raw) as { scores?: ScoreResult[] }
  return result.scores ?? []
}

export const POST = withAuth(async (_req: NextRequest, { user }) => {
  try {
    // Son skorlama zamanını kontrol et — 7 günden yeniyse skip
    const latestScore = await db.userSupplementScore.findFirst({
      where: { userId: user.id },
      orderBy: { scoredAt: 'desc' },
      select: { scoredAt: true },
    })

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    if (latestScore && latestScore.scoredAt > oneWeekAgo) {
      return NextResponse.json({ message: 'Scores are up to date', fresh: true })
    }

    // Kullanıcı profilini ve mevcut supplementlerini çek
    const [basicProfile, existingSupps, catalog] = await Promise.all([
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
      db.supplement.findMany({
        where: { userId: user.id, isActive: true },
        select: { name: true, dosage: true, unit: true },
      }),
      db.supplementCatalog.findMany({
        where: { country: 'global' },
        select: { id: true, name: true, category: true, doseInfo: true, benefit: true },
        orderBy: { name: 'asc' },
      }),
    ])

    const profileSummary = basicProfile
      ? `Yaş:${basicProfile.age ?? '?'}, Cinsiyet:${basicProfile.gender ?? '?'}, Ağırlık:${basicProfile.weight ?? '?'}kg, Hedef:${basicProfile.primaryGoal ?? '?'}, Seviye:${basicProfile.fitnessLevel ?? '?'}`
      : 'Profil bilgisi yok'

    const existingSuppsText =
      existingSupps.map((s) => `${s.name} ${s.dosage}${s.unit}`).join(', ') || 'yok'

    // Batch'lere böl ve paralel gönder
    const batches: (typeof catalog)[] = []
    for (let i = 0; i < catalog.length; i += BATCH_SIZE) {
      batches.push(catalog.slice(i, i + BATCH_SIZE))
    }

    const allScores: ScoreResult[] = []
    for (const batch of batches) {
      const scores = await scoreBatch(batch, profileSummary, existingSuppsText)
      allScores.push(...scores)
    }

    // DB'ye upsert
    await Promise.all(
      allScores.map((s) =>
        db.userSupplementScore.upsert({
          where: { userId_catalogId: { userId: user.id, catalogId: s.id } },
          create: {
            userId: user.id,
            catalogId: s.id,
            score: s.score,
            aiNote: s.aiNote,
            timing: s.timing,
            interactions: s.interactions,
            allergens: s.allergens,
            alternatives: s.alternatives,
            evidenceLevel: s.evidenceLevel,
          },
          update: {
            score: s.score,
            aiNote: s.aiNote,
            scoredAt: new Date(),
            timing: s.timing,
            interactions: s.interactions,
            allergens: s.allergens,
            alternatives: s.alternatives,
            evidenceLevel: s.evidenceLevel,
          },
        })
      )
    )

    return NextResponse.json({ message: 'Scores updated', count: allScores.length })
  } catch (error) {
    console.error('[score-catalog POST]', error)
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 })
  }
})

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const scores = await db.userSupplementScore.findMany({
      where: { userId: user.id },
      select: {
        catalogId: true,
        score: true,
        aiNote: true,
        timing: true,
        interactions: true,
        allergens: true,
        alternatives: true,
        evidenceLevel: true,
        scoredAt: true,
      },
    })

    return NextResponse.json({
      scores: Object.fromEntries(
        scores.map((s) => [
          s.catalogId,
          {
            score: s.score,
            aiNote: s.aiNote,
            timing: s.timing,
            interactions: s.interactions,
            allergens: s.allergens,
            alternatives: s.alternatives,
            evidenceLevel: s.evidenceLevel,
          },
        ])
      ),
      scoredAt: scores[0]?.scoredAt ?? null,
      count: scores.length,
    })
  } catch (error) {
    console.error('[score-catalog GET]', error)
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 })
  }
})
