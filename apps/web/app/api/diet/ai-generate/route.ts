import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { openai, AI_MODEL } from '@/lib/ai/client'

export const POST = withAuth(async (req, ctx) => {
  try {
    const { preferences } = await req.json()
    const userId = ctx.user.id

    const profile = await db.userBasicProfile.findUnique({ where: { userId } }).catch(() => null)

    const profileContext = [
      profile?.weight ? `Kilo: ${profile.weight}kg` : '',
      profile?.height ? `Boy: ${profile.height}cm` : '',
      profile?.age ? `Yaş: ${profile.age}` : '',
      profile?.gender ? `Cinsiyet: ${profile.gender}` : '',
      preferences?.goal ? `Hedef: ${preferences.goal}` : '',
      preferences?.restrictions?.length
        ? `Kısıtlamalar: ${preferences.restrictions.join(', ')}`
        : '',
      preferences?.cuisinePreferences?.length
        ? `Mutfak tercihleri: ${preferences.cuisinePreferences.join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    const prompt = `Sen bir beslenme uzmanısın. Aşağıdaki kullanıcı profiline göre kişiselleştirilmiş bir diyet planı oluştur.

${profileContext}

Günlük öğün sayısı: ${preferences?.mealsPerDay ?? 4}
Plan süresi: ${preferences?.durationDays ?? 30} gün

ZORUNLU FORMAT (sadece JSON döndür, başka hiçbir şey yok):
{
  "name": "Plan adı (max 40 karakter)",
  "accentColor": "#HEX (sağlıklı, yeşil/mavi tonları)",
  "dailyCalories": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "rules": {
    "allowed": ["izin verilen yiyecekler listesi (5-8 madde)"],
    "avoid": ["kaçınılacaklar (5-8 madde)"],
    "tips": ["ipuçları (3-5 madde)"]
  },
  "mealPool": {
    "breakfast": [
      {
        "name": "Öğün adı",
        "items": [
          {
            "name": "Besin adı",
            "servingSize": 100,
            "servingUnit": "g",
            "quantity": 1,
            "calories": 150,
            "proteinG": 10,
            "carbsG": 20,
            "fatG": 3
          }
        ]
      }
    ],
    "lunch": [],
    "dinner": [],
    "snack": []
  }
}

Her mealType için en az 3 farklı seçenek üret. Türkçe yemek isimleri kullan. Kalori ve makro değerleri gerçekçi olsun.`

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    if (!text) return NextResponse.json({ error: 'AI plan generation failed' }, { status: 500 })

    const aiPlan = JSON.parse(text)
    aiPlan.aiPreferences = preferences

    return NextResponse.json({ aiPlan })
  } catch (err) {
    console.error('[diet/ai-generate POST]', err)
    return NextResponse.json({ error: 'Failed to generate AI plan' }, { status: 500 })
  }
})
