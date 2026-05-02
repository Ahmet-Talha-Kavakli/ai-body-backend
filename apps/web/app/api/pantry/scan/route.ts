import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { image } = (await req.json()) as { image: string }
    if (!image) {
      return NextResponse.json({ error: 'image required (base64)' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Sen bir buzdolabı/mutfak içerik analizcisisin. Verilen fotoğraftaki tüm yiyecek ve içecekleri tanı, miktar tahmin et. Sadece görünen ürünleri listele, eklemece yapma. Türkçe ürün adları kullan.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${image}`, detail: 'high' },
            },
            {
              type: 'text',
              text: `Bu fotoğraftaki yiyecekleri/içecekleri JSON listesi olarak döndür.

Format:
{
  "items": [
    {
      "name": "ürün adı (Türkçe)",
      "category": "protein | sebze | meyve | süt | tahıl | baharat | içecek | diğer",
      "quantity": tahmini miktar (sayı, yoksa null),
      "unit": "g | adet | paket | şişe | kutu | ml" (yoksa null),
      "estimatedShelfDays": tahmini raf ömrü gün cinsinden (örn süt 5, peynir 14, salatalık 7)
    }
  ]
}

Kurallar:
- Açık paketleri (yarım yenmiş yoğurt vs.) ayrı kalem olarak listeleme — toplu kalem.
- Aynı üründen birden fazla varsa quantity'i toplam olarak ver.
- Marka adı kullanma, sadece ürün türü.
- Görünmeyen şeyleri tahmin etme.`,
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content ?? '{"items":[]}'
    const parsed = JSON.parse(content) as {
      items: Array<{
        name: string
        category?: string
        quantity?: number | null
        unit?: string | null
        estimatedShelfDays?: number | null
      }>
    }

    // Add expiresAt based on estimatedShelfDays
    const now = Date.now()
    const items = (parsed.items ?? []).map((it) => ({
      name: it.name,
      category: it.category ?? 'diğer',
      quantity: it.quantity ?? null,
      unit: it.unit ?? null,
      expiresAt: it.estimatedShelfDays
        ? new Date(now + it.estimatedShelfDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
    }))

    return NextResponse.json({ items })
  } catch (err) {
    console.error('[pantry/scan POST]', err)
    return NextResponse.json({ error: 'Photo scan failed' }, { status: 500 })
  }
})
