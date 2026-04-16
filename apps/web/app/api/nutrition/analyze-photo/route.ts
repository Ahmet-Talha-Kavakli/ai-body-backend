import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { image, mealType } = (await req.json()) as { image: string; mealType: string }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Sen bir diyetisyen AI asistanısın. Yemek fotoğrafını analiz et ve besin değerlerini JSON formatında döndür.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}`, detail: 'low' },
            },
            {
              type: 'text',
              text: `Bu yemeği analiz et. Format: {"foods": [{"name": "string", "calories": number, "protein": number, "carbs": number, "fat": number, "amount": number, "unit": "g"}]}. Öğün: ${mealType}`,
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content ?? '{}'
    return NextResponse.json(JSON.parse(content))
  } catch (err) {
    console.error('[nutrition/analyze-photo POST]', err)
    return NextResponse.json({ error: 'Photo analysis failed' }, { status: 500 })
  }
})
