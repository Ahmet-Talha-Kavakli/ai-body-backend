import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { openai } from '@/lib/ai/client'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { imageBase64, mealType } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'Fotoğraf gerekli' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: `Bu yemek fotoğrafını analiz et ve besin değerlerini tahmin et.
Türkçe yanıt ver. Sadece JSON döndür:
{
  "foodItems": [
    { "name": "Yemek adı", "portion": "Porsiyon", "calories": 0, "proteinG": 0, "carbsG": 0, "fatG": 0 }
  ],
  "totalCalories": 0,
  "totalProteinG": 0,
  "totalCarbsG": 0,
  "totalFatG": 0,
  "confidence": "high|medium|low",
  "notes": "Ek not"
}`,
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const analysis = JSON.parse(response.choices[0]?.message?.content ?? '{}')

    // Otomatik kaydet
    const user = await db.user.findUnique({ where: { clerkId } })
    if (user) {
      await db.mealLog.create({
        data: {
          userId: user.id,
          mealType: mealType ?? 'snack',
          items: analysis.foodItems ?? [],
          totalCalories: analysis.totalCalories ?? 0,
          totalProteinG: analysis.totalProteinG ?? 0,
          totalCarbsG: analysis.totalCarbsG ?? 0,
          totalFatG: analysis.totalFatG ?? 0,
          aiAnalyzed: true,
          notes: analysis.notes,
        },
      })
    }

    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error('Meal analysis error:', error)
    return NextResponse.json({ error: 'Analiz yapılamadı' }, { status: 500 })
  }
}
