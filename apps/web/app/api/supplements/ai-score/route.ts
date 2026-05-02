import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { openai, AI_MODEL } from '@/lib/ai/client'

const RequestSchema = z.object({
  supplementIds: z.array(z.string()).optional(),
  catalogItems: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        brand: z.string().optional(),
        category: z.string().optional(),
        doseInfo: z.string().optional(),
        benefit: z.string().optional(),
      })
    )
    .optional(),
})

type ScoreResult = {
  id: string
  score: 'green' | 'yellow' | 'red'
  aiNote: string
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Kullanıcı profilini çek
    const [basicProfile, existingSupps] = await Promise.all([
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
    ])
    const profile = basicProfile

    // Skorlanacak ürünleri hazırla
    let itemsToScore: Array<{
      id: string
      name: string
      brand?: string | null
      category?: string | null
      doseInfo?: string | null
      benefit?: string | null
    }> = []

    if (parsed.data.supplementIds?.length) {
      const dbSupps = await db.supplement.findMany({
        where: { id: { in: parsed.data.supplementIds }, userId: user.id },
        select: { id: true, name: true, brand: true, category: true, dosage: true },
      })
      itemsToScore = dbSupps.map((s) => ({
        id: s.id,
        name: s.name,
        brand: s.brand,
        category: s.category,
      }))
    } else if (parsed.data.catalogItems?.length) {
      itemsToScore = parsed.data.catalogItems
    }

    if (itemsToScore.length === 0) {
      return NextResponse.json({ scores: [] })
    }

    const profileSummary = profile
      ? `Yaş: ${profile.age ?? 'bilinmiyor'}, Cinsiyet: ${profile.gender ?? 'bilinmiyor'}, Ağırlık: ${profile.weight ?? '?'}kg, Boy: ${profile.height ?? '?'}cm, Hedef: ${profile.primaryGoal ?? 'bilinmiyor'}, Seviye: ${profile.fitnessLevel ?? 'bilinmiyor'}`
      : 'Profil bilgisi yok'

    const existingSuppsText =
      existingSupps.map((s) => `${s.name} ${s.dosage}${s.unit}`).join(', ') || 'yok'

    const itemsText = itemsToScore
      .map(
        (i) =>
          `ID:${i.id} | ${i.name}${i.brand ? ` (${i.brand})` : ''}${i.category ? ` [${i.category}]` : ''}${i.doseInfo ? ` - ${i.doseInfo}` : ''}`
      )
      .join('\n')

    const systemPrompt = `Sen bir klinik beslenme uzmanısın. Kullanıcı profili ve mevcut supplementleri göz önünde bulundurarak her supplement için kısa bir değerlendirme yap.

JSON formatında yanıt ver:
{
  "scores": [
    { "id": "...", "score": "green|yellow|red", "aiNote": "max 100 karakter, kişisel ve spesifik" }
  ]
}

Kurallar:
- green: kullanıcı için güvenli ve faydalı
- yellow: dikkat gerektiren, potansiyel etkileşim veya doz riski var
- red: bu kullanıcı için önerilmez (sağlık durumu, ilaç etkileşimi, fazla doz riski vs.)
- aiNote Türkçe olsun, 1 cümle, kullanıcıya direkt hitap et`

    const userMessage = `Kullanıcı Profili: ${profileSummary}
Mevcut Kullandığı Supplementler: ${existingSuppsText}

Skorlanacak Ürünler:
${itemsText}`

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1000,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw) as { scores?: ScoreResult[] }
    const scores: ScoreResult[] = result.scores ?? []

    // Kullanıcının kendi supplementleri ise DB'ye aiScore+aiNote kaydet
    if (parsed.data.supplementIds?.length && scores.length > 0) {
      await Promise.all(
        scores.map((s) =>
          db.supplement
            .update({
              where: { id: s.id },
              data: { aiScore: s.score, aiNote: s.aiNote },
            })
            .catch(() => null)
        )
      )
    }

    return NextResponse.json({ scores })
  } catch (error) {
    console.error('[supplements/ai-score POST]', error)
    return NextResponse.json({ error: 'AI scoring failed' }, { status: 500 })
  }
})
