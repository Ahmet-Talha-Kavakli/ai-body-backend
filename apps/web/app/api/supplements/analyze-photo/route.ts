import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/api/with-auth'
import { openai, AI_MODEL } from '@/lib/ai/client'

const RequestSchema = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
})

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input — imageBase64 required' }, { status: 400 })
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
              text: `Bu supplement/vitamin ürününün etiketini analiz et ve aşağıdaki JSON formatında bilgileri çıkar:
{
  "name": "ürün adı",
  "brand": "marka",
  "category": "Vitamin|Mineral|Protein|Yağ Asidi|Probiyotik|Performans|Bitki|Yağ Yakıcı|genel",
  "type": "vitamin|omega|protein|kreatin|magnezyum|probiyotik|genel",
  "dosage": "doz miktarı (sayı)",
  "unit": "mg|mcg|g|IU|ml|CFU",
  "timing": "morning|noon|evening|pre-workout|post-workout|before-sleep",
  "barcode": "eğer görünüyorsa barkod numarası, yoksa null",
  "confidence": 0.0-1.0
}

Eğer supplement etiketi göremiyorsan: { "error": "Supplement etiketi bulunamadı" }
Türkçe değerleri belirtilen şemaya göre İngilizce karşılıklarıyla doldur.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' },
            },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw) as Record<string, unknown>

    if (result.error) {
      return NextResponse.json({ found: false, error: result.error })
    }

    return NextResponse.json({ found: true, ...result })
  } catch (error) {
    console.error('[supplements/analyze-photo POST]', error)
    return NextResponse.json({ error: 'Photo analysis failed' }, { status: 500 })
  }
})
