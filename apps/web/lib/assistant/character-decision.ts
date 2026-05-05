/**
 * V4 Faz D — Character Decision Engine
 *
 * Her karakter için "şu an ne yapmalıyım?" sorusunu cevaplıyor.
 *
 * İki katmanlı:
 *   - Hızlı katman (FAST): kural bazlı, anlık, ücretsiz. Çoğu karar burada biter.
 *   - Derin katman (DEEP): mini AI çağrısı (gpt-4o-mini), karmaşık durumlarda.
 *
 * Akış (kullanıcı mesaj attı):
 *   1. Hızlı katman → respond_quick / proceed / skip / delay
 *   2. proceed → derin katman → tone, depth, multi-message, mood shift, vs.
 *   3. Karakter ana AI çağrısına ipucu veriyor
 */

import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import type { RelationshipStatus } from './character-relationship'

// === HIZLI KATMAN ===

export interface FastLayerInput {
  characterStatus: 'active' | 'cold' | 'silent' | 'broken' | 'recovering' | 'departed'
  relationshipStatus: RelationshipStatus | null
  characterMood: string | null
  userLocalHour: number
  daysSinceLastInteraction?: number | null
  isUserHostile?: boolean
  isEmergency?: boolean
}

export interface FastLayerDecision {
  action: 'proceed' | 'respond_quick' | 'skip' | 'delay'
  delayMs?: number
  quickReply?: string
  reason: string
}

/**
 * Hızlı katman — saniyenin altında karar.
 */
export function fastDecisionLayer(input: FastLayerInput): FastLayerDecision {
  const {
    characterStatus,
    relationshipStatus,
    characterMood,
    userLocalHour,
    isUserHostile,
    isEmergency,
  } = input

  // Acil durum her şeyi atlatır
  if (isEmergency) {
    return { action: 'proceed', reason: 'emergency_override' }
  }

  // Karakter departed/dead → hiç konuşmaz
  if (characterStatus === 'departed') {
    return { action: 'skip', reason: 'character_departed' }
  }

  // İlişki silent → karakter cevap vermiyor (ama emergency hariç)
  if (relationshipStatus === 'silent') {
    return { action: 'skip', reason: 'silent_treatment' }
  }

  // Broken → kısa şablon cevap (V3'teki cold gibi davransın)
  if (relationshipStatus === 'broken') {
    return {
      action: 'respond_quick',
      quickReply: 'Şu an konuşmak istemiyorum.',
      reason: 'broken_relationship',
    }
  }

  // Hostility detection — direct
  if (isUserHostile) {
    return {
      action: 'respond_quick',
      quickReply: 'Bunu yapma. Sınır var.',
      reason: 'hostility_detected',
    }
  }

  // Karakter çok yorgun ve gece geç → uzun gecikme
  if (characterMood === 'tired' && (userLocalHour >= 23 || userLocalHour < 6)) {
    return { action: 'delay', delayMs: 15000, reason: 'tired_late_night' }
  }

  // Cold ilişki → kısa gecikme + kısa cevap (proceed ama derin katmana coldHint)
  if (relationshipStatus === 'cold') {
    return { action: 'proceed', reason: 'cold_proceed' }
  }

  // Recovering → proceed (yumuşamaya başladı)
  if (relationshipStatus === 'recovering') {
    return { action: 'proceed', reason: 'recovering_proceed' }
  }

  return { action: 'proceed', reason: 'normal' }
}

// === DERİN KATMAN ===

export interface DeepLayerInput {
  characterId: string
  characterName: string
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  userMessage: string
  relationshipStatus: RelationshipStatus | null
  characterMood: string | null
  intimacyDepth: number
}

export interface DeepLayerDecision {
  shouldRespond: boolean
  responseDepth: 'shallow' | 'medium' | 'deep'
  tone: 'warm' | 'cold' | 'playful' | 'concerned' | 'neutral' | 'tender' | 'firm' | 'distant'
  multiMessage: boolean
  messageCount: 1 | 2 | 3
  delayMs: number
  moodShift: string | null
  shareSecret: boolean
  hint: string // System prompt'a verilecek tek satırlık ipucu
}

const DEEP_PROMPT = `Sen bir karakter karar motorusun. Karaktere son mesajı analiz edip nasıl cevap vermesi gerektiğine karar veriyorsun.

JSON çıktı formatı:
{
  "shouldRespond": true|false,
  "responseDepth": "shallow"|"medium"|"deep",
  "tone": "warm"|"cold"|"playful"|"concerned"|"neutral"|"tender"|"firm"|"distant",
  "multiMessage": true|false,
  "messageCount": 1|2|3,
  "delayMs": 0..15000,
  "moodShift": null|"tired"|"thoughtful"|"energetic"|"calm",
  "shareSecret": false,
  "hint": "tek satırlık tonlama ipucu — örn: 'Karakter duygusal bir an, kısa ve yumuşak cevap'"
}

Kurallar:
- multiMessage: true → karakter birden fazla mesaj atacak (max 3). Sadece duygusal/şaşırtıcı/şaka+ciddi anlarda.
- shareSecret: true → çok yüksek intimacy + duygusal an. Nadir.
- responseDepth shallow = 1 cümle, medium = 2-3, deep = 4-5.
- hint: Türkçe, tek satır, karakter prompt'una ipucu.`

export async function deepDecisionLayer(input: DeepLayerInput): Promise<DeepLayerDecision | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const recentText = input.recentMessages
      .slice(-8)
      .map((m) => `${m.role === 'user' ? 'KULLANICI' : input.characterName}: ${m.content}`)
      .join('\n')

    const userPrompt = `KARAKTER: ${input.characterName}
İLİŞKİ DURUMU: ${input.relationshipStatus ?? 'normal'}
KARAKTER MOOD: ${input.characterMood ?? 'calm'}
YAKINLIK: ${(input.intimacyDepth * 100).toFixed(0)}%

SON SOHBET:
${recentText}

KULLANICI ŞU ANKİ MESAJ: "${input.userMessage}"

Karakter şu an ne yapmalı?`

    const startedAt = Date.now()
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DEEP_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 400,
    })

    const raw = r.choices[0]?.message?.content
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DeepLayerDecision>

    // Log
    try {
      const usage = r.usage
      await db.aiCallLog.create({
        data: {
          userId: '', // userId'yi caller dolduruyor — burada empty
          characterId: input.characterId,
          model: 'gpt-4o-mini',
          provider: 'openai',
          purpose: 'decision_deep',
          inputTokens: usage?.prompt_tokens ?? 0,
          outputTokens: usage?.completion_tokens ?? 0,
          costUsd:
            ((usage?.prompt_tokens ?? 0) * 0.15) / 1_000_000 +
            ((usage?.completion_tokens ?? 0) * 0.6) / 1_000_000,
          durationMs: Date.now() - startedAt,
        },
      })
    } catch {}

    // Defaults + clamp
    return {
      shouldRespond: parsed.shouldRespond ?? true,
      responseDepth: parsed.responseDepth ?? 'medium',
      tone: parsed.tone ?? 'neutral',
      multiMessage: parsed.multiMessage ?? false,
      messageCount: clampInt(parsed.messageCount ?? 1, 1, 3) as 1 | 2 | 3,
      delayMs: clampInt(parsed.delayMs ?? 0, 0, 15000),
      moodShift: parsed.moodShift ?? null,
      shareSecret: parsed.shareSecret ?? false,
      hint: parsed.hint ?? '',
    }
  } catch (e) {
    console.error('[deep-decision]', e)
    return null
  }
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)))
}

/**
 * DeepLayerDecision'ı system prompt için tek-satır hint'e çevirir.
 */
export function decisionToPromptHint(d: DeepLayerDecision): string {
  const parts: string[] = []
  parts.push(`Tonun: ${d.tone}`)
  parts.push(`Derinlik: ${d.responseDepth}`)
  if (d.multiMessage) parts.push(`Çoklu mesaj at (${d.messageCount} parça)`)
  if (d.moodShift) parts.push(`Mood'un ${d.moodShift}'a kayıyor`)
  if (d.shareSecret) parts.push(`Bu an bir sırrını paylaşmaya değer — paylaşmak istiyorsan paylaş`)
  if (d.hint) parts.push(d.hint)
  return parts.join(' | ')
}
