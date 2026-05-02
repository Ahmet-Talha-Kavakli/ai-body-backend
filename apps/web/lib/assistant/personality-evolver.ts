/**
 * Personality Evolver V2 (Faz L2) — kullanıcı iletişim stiline göre asistan kişiliğini günceller.
 * Her 10 user mesajında bir tetiklenir (background, kullanıcıyı bekletmez).
 *
 * 6 boyut:
 *  - formality (0=samimi, 1=resmi)
 *  - humor (0=ciddi, 1=esprili)
 *  - directness (0=dolaylı, 1=direkt)
 *  - msgLengthPref (0=kısa, 1=uzun) — kullanıcının kendi mesaj uzunluğu
 *  - emojiPref (0=hiç, 1=çok)
 *  - emotionalOpenness (0=içe atan, 1=dökülen)
 *  - needsAdvice (0=sadece dinle, 1=öneri ister)
 *  - supportStyle (enum: coaching | nurturing | informational)
 *
 * Kullanıcı kendisi söyleyebilir ("kısa konuş", "espri yap") — bu bir cevaba değil,
 * birkaç mesaja yansımalı. Evolver tüm sinyalleri derler.
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'

const EVOLVE_PROMPT = `Sen bir personality calibrator'sın. Kullanıcının yazdığı son mesajları analiz et,
iletişim tarzını çıkar. Asistanın bu kullanıcıyla nasıl iletişim kuracağını ayarlamak için skor ver.

8 boyut. Her biri 0-1 arası float, ya da değişiklik yoksa null.

formality (0=samimi/argo, 1=resmi):
  - "kanka, abi, lan, sen" → 0.0-0.3
  - karma → 0.4-0.6
  - "siz, lütfen, rica etsem" → 0.7-1.0

humor (0=ciddi/soğuk, 1=esprili/oyuncu):
  - emoji yok, kısa, soğuk → 0.0-0.3
  - bazen şaka → 0.4-0.6
  - sık şaka, esprili → 0.7-1.0

directness (0=dolambaçlı, 1=direkt):
  - uzun açıklamalı, dolaylı → 0.0-0.3
  - dengeli → 0.4-0.6
  - kısa, net, "git, yap" tarzı → 0.7-1.0

msgLengthPref (0=kısa, 1=uzun) — kullanıcının ortalama mesaj uzunluğu:
  - 1-2 kelime, kısa → 0.0-0.3
  - 1-2 cümle → 0.4-0.6
  - paragraf, uzun → 0.7-1.0

emojiPref (0=hiç emoji, 1=çok emoji):
  - hiç → 0.0
  - bazen 1-2 → 0.3-0.5
  - sık 3+ → 0.7-1.0

emotionalOpenness (0=içine atan, 1=dökülen):
  - "iyiyim", duygu paylaşmaz → 0.0-0.3
  - bazen paylaşır → 0.4-0.6
  - duygularını kolayca açar → 0.7-1.0

needsAdvice (0=sadece dinle, 1=somut öneri ister):
  - "anlat", "duy beni" → 0.0-0.3
  - karma → 0.4-0.6
  - "ne yapayım", "söyle" → 0.7-1.0

supportStyle:
  - "coaching": motivasyon ve hedef odaklı
  - "nurturing": duygusal destek odaklı
  - "informational": bilgi/veri odaklı

ÇOK ÖNEMLİ:
- Mevcut profile'a göre SADECE NET DEĞİŞİM varsa yaz. Küçük dalgalanmaları (ör. 0.45 → 0.5) yazma.
- Kullanıcı açıkça söylediyse ("daha kısa konuş", "bu kadar emoji koyma") büyük adımla güncelle.
- Hiçbir alan değişmiyorsa: tüm alanlar null.

Yanıtın SADECE JSON formatında:
{
  "formality": 0.4 | null,
  "humor": 0.6 | null,
  "directness": 0.5 | null,
  "msgLengthPref": 0.3 | null,
  "emojiPref": 0.2 | null,
  "emotionalOpenness": 0.7 | null,
  "needsAdvice": 0.4 | null,
  "supportStyle": "coaching" | "nurturing" | "informational" | null
}

Sadece JSON dön, başka açıklama yok.`

// V2 Chunk 6: 20 → 10. AI kişiliği daha hızlı uyarlasın diye sıklığı yarıya düşürdük.
const TRIGGER_EVERY_N_MESSAGES = 10

export async function maybeEvolvePersonality(userId: string): Promise<void> {
  try {
    const userMessageCount = await db.assistantMessage.count({
      where: { role: 'user', conversation: { userId } },
    })

    if (userMessageCount === 0 || userMessageCount % TRIGGER_EVERY_N_MESSAGES !== 0) {
      return
    }

    const messages = await db.assistantMessage.findMany({
      where: { role: 'user', conversation: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { content: true },
    })

    if (messages.length < 5) return

    const profile = await db.assistantProfile.findUnique({ where: { userId } })
    if (!profile) return

    const samples = messages.map((m, i) => `${i + 1}. ${m.content.slice(0, 200)}`).join('\n')

    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 250,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EVOLVE_PROMPT },
        {
          role: 'user',
          content: `Mevcut profile:
formality: ${profile.formality}
humor: ${profile.humor}
directness: ${profile.directness}
msgLengthPref: ${profile.msgLengthPref}
emojiPref: ${profile.emojiPref}
emotionalOpenness: ${profile.emotionalOpenness}
needsAdvice: ${profile.needsAdvice}
supportStyle: ${profile.supportStyle}

Son 30 user mesajı (en yeni önce):
${samples}`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? '{}'
    let parsed: {
      formality?: number | null
      humor?: number | null
      directness?: number | null
      msgLengthPref?: number | null
      emojiPref?: number | null
      emotionalOpenness?: number | null
      needsAdvice?: number | null
      supportStyle?: string | null
    }
    try {
      parsed = JSON.parse(text)
    } catch {
      return
    }

    const updates: Record<string, unknown> = {}
    const numericFields: Array<keyof typeof parsed> = [
      'formality',
      'humor',
      'directness',
      'msgLengthPref',
      'emojiPref',
      'emotionalOpenness',
      'needsAdvice',
    ]
    for (const f of numericFields) {
      const v = parsed[f]
      if (typeof v === 'number' && v >= 0 && v <= 1) {
        updates[f] = v
      }
    }
    if (
      typeof parsed.supportStyle === 'string' &&
      ['coaching', 'nurturing', 'informational'].includes(parsed.supportStyle)
    ) {
      updates.supportStyle = parsed.supportStyle
    }

    if (Object.keys(updates).length === 0) return

    await db.assistantProfile.update({
      where: { userId },
      data: updates,
    })
  } catch (e) {
    console.error('[personality-evolver]', e)
  }
}
