/**
 * Tone Analyzer — kullanıcı mesajının duygusal tonunu tespit eder.
 *
 * AI'ya "kullanıcı şu an üzgün" gibi bilgi enjekte ederek tonunu ayarlamasına izin verir.
 * gpt-4o-mini ile tek çağrı, ~150ms gecikme ekler.
 *
 * Tetiklenme: stream başlamadan önce paralel olarak çalışır.
 * Hata olursa neutral döner — kullanıcıyı etkilemez.
 */

import OpenAI from 'openai'

const TONE_PROMPT = `Sen bir duygu analiz servisisin. Kullanıcının son mesajından ruh halini tespit et.

KATEGORILER:
- neutral: normal, günlük konuşma
- sad: üzgün, kederli, kayıp/yas
- stressed: stresli, kaygılı, panik, baskı altında
- angry: öfkeli, sinirli, hayal kırıklığı
- happy: mutlu, heyecanlı, başarı/sevinç paylaşıyor
- tired: yorgun, bitkin, motivasyonsuz
- lonely: yalnız hisseden, izole

KURALLAR:
- Mesaj kısaysa ve net duygu yoksa "neutral" dön.
- Birden fazla duygu varsa en baskını seç.
- Sadece KESIN olduğun durumda neutral dışına çık. Şüphedeysen neutral.
- "support_needed" alanı: kullanıcının çözüm istediği mi (advice), yoksa sadece dinlenmek istediği mi (listen)?
  • Üzgün/yorgun/yalnız → genelde "listen"
  • Stresli/öfkeli → bağlama göre değişir
  • Mutlu/neutral → "neither"

Sadece JSON dön:
{"tone": "neutral|sad|stressed|angry|happy|tired|lonely", "intensity": 0.0-1.0, "support_needed": "listen|advice|neither"}`

export interface ToneAnalysis {
  tone: 'neutral' | 'sad' | 'stressed' | 'angry' | 'happy' | 'tired' | 'lonely'
  intensity: number
  supportNeeded: 'listen' | 'advice' | 'neither'
}

export async function analyzeTone(userMessage: string): Promise<ToneAnalysis> {
  const fallback: ToneAnalysis = { tone: 'neutral', intensity: 0, supportNeeded: 'neither' }

  // Çok kısa mesajlar için API çağrısı yapma
  if (userMessage.trim().length < 8) return fallback

  try {
    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 80,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: TONE_PROMPT },
        { role: 'user', content: userMessage.slice(0, 500) },
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(text) as Partial<{
      tone: string
      intensity: number
      support_needed: string
    }>

    const validTones = ['neutral', 'sad', 'stressed', 'angry', 'happy', 'tired', 'lonely']
    const validSupport = ['listen', 'advice', 'neither']

    return {
      tone: (validTones.includes(parsed.tone ?? '')
        ? parsed.tone
        : 'neutral') as ToneAnalysis['tone'],
      intensity:
        typeof parsed.intensity === 'number' ? Math.max(0, Math.min(1, parsed.intensity)) : 0.5,
      supportNeeded: (validSupport.includes(parsed.support_needed ?? '')
        ? parsed.support_needed
        : 'neither') as ToneAnalysis['supportNeeded'],
    }
  } catch (e) {
    console.error('[tone-analyzer]', e)
    return fallback
  }
}

/**
 * Tone analizini AI'nın anlayacağı bir prompt ekine dönüştür.
 * Sistem prompt'a eklenir, AI bunu okur ve tonunu ayarlar.
 */
export function toneToPromptHint(tone: ToneAnalysis): string {
  if (tone.tone === 'neutral' || tone.intensity < 0.4) return ''

  const intensityLabel = tone.intensity > 0.7 ? 'yoğun' : 'belirgin'

  const guidance: Record<ToneAnalysis['tone'], string> = {
    sad: `Kullanıcı şu an ÜZGÜN (${intensityLabel}). Tool çağırma, çözüm sunma. Önce duygusunu doğrula, dinle. "Anlıyorum", "yanındayım" gibi kısa, sıcak cümleler. Soru sorabilir ama ucu açık ve hafif olmalı.`,
    stressed: `Kullanıcı şu an STRESLİ (${intensityLabel}). Hızlı çözüm sunma. Önce nefes aldır — "biraz yavaşla, anlat". Ondan sonra ne yapmak istediğini sor.`,
    angry: `Kullanıcı şu an ÖFKELİ (${intensityLabel}). Akıl verme, savunmaya geçme. "Haklısın, anlıyorum" gibi kabul cümleleri. Sebebi anla, sonra bak.`,
    happy: `Kullanıcı şu an MUTLU (${intensityLabel}). Onun enerjisine eşlik et, kuru kalma. Kısa kutla, paylaşımı önemse.`,
    tired: `Kullanıcı YORGUN (${intensityLabel}). Uzun mesaj yazma. Hafif ol. Tool çağırma. "Bugün kendine zaman tanı" gibi yumuşak destek.`,
    lonely: `Kullanıcı YALNIZ hissediyor (${intensityLabel}). Sıcak ol. Yargılama. "Buradayım, dinliyorum" mesajı ver. Sohbeti sürdür ki yalnız hissetmesin.`,
    neutral: '',
  }

  let hint = guidance[tone.tone]

  if (tone.supportNeeded === 'listen') {
    hint += ' Kullanıcı çözüm istemiyor — sadece dinlenmek istiyor. Tavsiye verme.'
  } else if (tone.supportNeeded === 'advice') {
    hint += ' Kullanıcı tavsiye/yön istiyor — kısa ve net öneri ver.'
  }

  return `\n\n[DUYGUSAL DURUM ALGISI]\n${hint}\n[/DUYGUSAL DURUM]`
}
