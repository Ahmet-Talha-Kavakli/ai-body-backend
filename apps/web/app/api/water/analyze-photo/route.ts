import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { openai } from '@/lib/ai/client'

const RequestSchema = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
})

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const { imageBase64, mimeType } = parsed.data

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Bu içecek veya içecek kabının fotoğrafını analiz et. JSON formatında bilgileri çıkar:
{
  "nametr": "içecek adı Türkçe",
  "nameen": "drink name English",
  "category": "water|tea|coffee|herbal|juice|sports|soda|dairy|smoothie|alcohol|other",
  "defaultMl": 250,
  "brand": "marka veya null",
  "confidence": 0.0-1.0
}

defaultMl tahmin rehberi: espresso=30, türk kahvesi=70, fincan kahve/çay=150, çay bardağı=200, su bardağı=200, büyük bardak=350, küçük şişe=330, normal şişe=500, büyük şişe=750.
Eğer içecek göremiyorsan: { "error": "İçecek bulunamadı" }`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'low' },
            },
          ],
        },
      ],
      max_tokens: 250,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw) as Record<string, unknown>

    if (result.error) {
      return NextResponse.json({ found: false, error: result.error })
    }

    return NextResponse.json({ found: true, ...result })
  } catch (error) {
    console.error('[water/analyze-photo POST]', error)
    return NextResponse.json({ error: 'Photo analysis failed' }, { status: 500 })
  }
})
