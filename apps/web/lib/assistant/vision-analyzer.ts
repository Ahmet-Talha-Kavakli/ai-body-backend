/**
 * V4.6 M59 — Vision API: Kullanıcı fotosunu analiz et
 *
 * Kullanıcı foto/video gönderdiğinde gpt-4o-mini Vision ile içerik analiz edilir,
 * sistem prompt'a inject edilir → karakter "görmüş gibi" konuşur.
 *
 * Maliyet kontrolü: low-detail mode, günlük limit (Faz 4 sonrası).
 */

import OpenAI from 'openai'

interface VisionAnalysis {
  category: 'food' | 'selfie' | 'landscape' | 'pet' | 'document' | 'meme' | 'other'
  description: string
  tags: string[]
  mood?: 'happy' | 'sad' | 'neutral' | 'excited'
}

export async function analyzeImage(imageUrl: string): Promise<VisionAnalysis | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bir arkadaşın gönderdiği fotoğrafı analiz ediyorsun. Bir Türkçe karakter (Mia) bu fotoğrafa doğal tepki verecek. Kısa, faydalı analiz dön.

JSON dön:
{"category":"food|selfie|landscape|pet|document|meme|other","description":"1-2 cümle ne gördüğün","tags":["max 5 etiket"],"mood":"happy|sad|neutral|excited"}`,
        },
        {
          role: 'user',
          content: [{ type: 'image_url', image_url: { url: imageUrl, detail: 'low' } }],
        },
      ],
      temperature: 0.6,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })
    const text = r.choices[0]?.message?.content
    if (!text) return null
    const parsed = JSON.parse(text) as Partial<VisionAnalysis>
    return {
      category: (parsed.category ?? 'other') as VisionAnalysis['category'],
      description: parsed.description ?? '',
      tags: parsed.tags ?? [],
      mood: parsed.mood,
    }
  } catch (e) {
    console.error('[vision-analyzer] fail:', e)
    return null
  }
}

export function buildVisionBlock(
  analysis: VisionAnalysis | null,
  mediaType: string | null
): string {
  if (!analysis) return ''
  const cat = analysis.category
  let hint = ''
  if (cat === 'food')
    hint = 'Yemek hakkında doğal yorum yap (lezzetli görünüyor mu, sen ne yiyorsun gibi).'
  else if (cat === 'selfie')
    hint = 'Selfie. Kişiye dair samimi yorum (yorgun görünüyor mu, neşeli mi).'
  else if (cat === 'landscape') hint = 'Manzara. Nereye gitti, nasıl hissediyor sor.'
  else if (cat === 'pet') hint = 'Hayvan. Hayvansever tonu — abartmadan.'
  else hint = 'Doğal merak göster.'

  return `[KULLANICI FOTO/VIDEO GÖNDERDİ]
Görsel: ${analysis.description}
Kategori: ${cat}
Etiketler: ${analysis.tags.join(', ')}

DAVRANIŞ: ${hint}
KURAL: Çok abartı tepki verme ("HARİKA!" "MUHTEŞEM!") — gerçek arkadaş tonu, kısa.\n\n`
}
