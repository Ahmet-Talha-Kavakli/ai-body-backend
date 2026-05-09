/**
 * V4.7 Faz 2 — Trigger Detector
 *
 * Stream içinde kullanıcı mesajı geldiğinde:
 *   - G1 PendingReflection (önemli mesaj → 6-12 saat sonra düşünme)
 *   - G4 PendingFollowUp (olay duyurusu → 24-48 saat sonra sorma)
 *
 * Hafif, hızlı detection — gpt-4o-mini ile sınıflandırma. Eğer mesaj uygun
 * kategoriye düşüyorsa kuyruk kayıt. Cron'lar bu kuyruğu işliyor.
 */

import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface TriggerClassification {
  reflectionTopic: 'event_announcement' | 'emotional_share' | 'question' | 'concern' | null
  reflectionImportance: number // 1-5
  reflectionSummary: string | null
  followUpTopic: string | null // "yarın iş görüşmesi"
  followUpDelay: number | null // saat cinsinden
}

const SYSTEM_PROMPT = `Aşağıdaki kullanıcı mesajını analiz et. İki ayrı şey arıyoruz:

1) REFLECTION TRIGGER: Bu mesaj karakterin "ileride üzerine düşüneceği" türden bir şey mi?
   Türler: 'event_announcement' (önemli olay duyurdu), 'emotional_share' (duygusal paylaşım), 'question' (önemli soru), 'concern' (endişe paylaşımı)
   Önem: 1-5 (1=trivial, 5=hayat değiştirici)
   Özet: 5-10 kelimelik konu özeti

2) FOLLOW-UP TRIGGER: Kullanıcı **gelecekte olacak bir olay** duyurdu mu? (sınav, görüşme, randevu, doktor, sınav sonucu vb.)
   Konu: ne hakkında olduğunu yaz
   Gecikme: olaydan sonra ne kadar süre içinde sorulacak (saat cinsinden, 12-72 arası)

JSON formatta cevap:
{
  "reflectionTopic": "..." | null,
  "reflectionImportance": 1-5,
  "reflectionSummary": "..." | null,
  "followUpTopic": "..." | null,
  "followUpDelay": 24 | null
}

Önemsiz mesajlar (selamlaşma, basit soru, sıradan günlük) için her iki alanı da null yap. Sadece **gerçekten** karaktere düşündürecek şeyleri işaretle.`

export async function detectTriggers(userMessage: string): Promise<TriggerClassification> {
  if (userMessage.trim().length < 10) {
    return {
      reflectionTopic: null,
      reflectionImportance: 1,
      reflectionSummary: null,
      followUpTopic: null,
      followUpDelay: null,
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage.slice(0, 1000) },
      ],
      max_tokens: 200,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) {
      return {
        reflectionTopic: null,
        reflectionImportance: 1,
        reflectionSummary: null,
        followUpTopic: null,
        followUpDelay: null,
      }
    }
    const parsed = JSON.parse(raw)
    return {
      reflectionTopic: parsed.reflectionTopic || null,
      reflectionImportance: Math.min(5, Math.max(1, Number(parsed.reflectionImportance) || 1)),
      reflectionSummary: parsed.reflectionSummary || null,
      followUpTopic: parsed.followUpTopic || null,
      followUpDelay: parsed.followUpDelay
        ? Math.min(72, Math.max(12, Number(parsed.followUpDelay)))
        : null,
    }
  } catch (e) {
    console.error('[v47-trigger-detect]', e)
    return {
      reflectionTopic: null,
      reflectionImportance: 1,
      reflectionSummary: null,
      followUpTopic: null,
      followUpDelay: null,
    }
  }
}

/**
 * Detection sonucuna göre PendingReflection ve PendingFollowUp kayıtları
 * oluştur. Stream sonrası (background) çağrılır — fire-and-forget.
 */
export async function persistTriggers(args: {
  userId: string
  characterId: string
  triggerMessageId: string
  classification: TriggerClassification
}): Promise<void> {
  const { userId, characterId, triggerMessageId, classification: c } = args

  try {
    // G1 — Reflection (sadece importance >= 3)
    if (c.reflectionTopic && c.reflectionSummary && c.reflectionImportance >= 3) {
      // 6-12 saat sonra (önem yüksekse erken)
      const hoursDelay = c.reflectionImportance >= 4 ? 6 + Math.random() * 3 : 9 + Math.random() * 3
      await db.pendingReflection.create({
        data: {
          characterId,
          userId,
          triggerMessageId,
          triggerSummary: c.reflectionSummary,
          topic: c.reflectionTopic,
          importance: c.reflectionImportance,
          scheduledFor: new Date(Date.now() + hoursDelay * 60 * 60 * 1000),
        },
      })
    }

    // G4 — Follow-up
    if (c.followUpTopic && c.followUpDelay) {
      // Daha önce aynı topic için aktif kayıt var mı?
      const existing = await db.pendingFollowUp.findFirst({
        where: {
          userId,
          characterId,
          topic: c.followUpTopic,
          processedAt: null,
        },
      })
      if (!existing) {
        await db.pendingFollowUp.create({
          data: {
            characterId,
            userId,
            triggerMessageId,
            topic: c.followUpTopic,
            scheduledFor: new Date(Date.now() + c.followUpDelay * 60 * 60 * 1000),
          },
        })
      }
    }
  } catch (e) {
    console.error('[v47-trigger-persist]', e)
  }
}
