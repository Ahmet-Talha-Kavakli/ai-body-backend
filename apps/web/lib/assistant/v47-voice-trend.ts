/**
 * V4.7 J7 — Voice Trend (Sesli mesaj stres takibi)
 *
 * Akış:
 *   1) Kullanıcı sesli mesaj atar → tone-analyzer çağrılır → ToneAnalysis çıkar.
 *   2) recordVoiceObservation() ile DB'ye kayıt.
 *   3) voice-trend-analyzer cron (günlük) son 14 gün penceresini analiz eder, eşik aşılırsa flag.
 *   4) buildVoiceTrendBlock prompt'a girer, karakter trust ≥60 ise bir kez dolaylı dürtme yapar.
 *
 * KURAL: Replika tonu YASAK. "Çok zorlu olmalı" / "kendine zaman ver" sızmamalı.
 */

import { db } from '@/lib/db/client'
import type { VoiceTone } from './voice-stt'

// ============================================================
// VoiceTone (hız/duraksama/yoğunluk) → tone+intensity mapping
// MVP: ham eşleme. Tam duygu analizi (ToneAnalysis) sonra eklenebilir.
// ============================================================

function voiceToneToObservation(vt: VoiceTone): {
  tone: 'neutral' | 'stressed' | 'tired'
  intensity: number
  supportNeeded: 'listen' | 'advice' | 'neither'
} {
  // Yoğun/gergin + duraklamalı/kararsız → stressed
  if (
    (vt.intensityHint === 'yoğun' || vt.intensityHint === 'gergin') &&
    (vt.hesitationLevel === 'duraklamalı' || vt.hesitationLevel === 'çok kararsız')
  ) {
    return { tone: 'stressed', intensity: 0.8, supportNeeded: 'listen' }
  }
  // Yoğun → stressed (orta)
  if (vt.intensityHint === 'yoğun') {
    return { tone: 'stressed', intensity: 0.65, supportNeeded: 'listen' }
  }
  // Sakin + çok yavaş → tired
  if (vt.intensityHint === 'sakin' && (vt.paceLabel === 'çok yavaş' || vt.paceLabel === 'yavaş')) {
    return { tone: 'tired', intensity: 0.6, supportNeeded: 'listen' }
  }
  // Default
  return { tone: 'neutral', intensity: 0.3, supportNeeded: 'neither' }
}

// ============================================================
// Observation kayıt (stream'de fire-and-forget)
// ============================================================

export async function recordVoiceObservation(args: {
  userId: string
  messageId?: string
  voiceTone: VoiceTone
  durationMs?: number
}): Promise<void> {
  const obs = voiceToneToObservation(args.voiceTone)
  await db.voiceObservation.create({
    data: {
      userId: args.userId,
      messageId: args.messageId ?? null,
      tone: obs.tone,
      intensity: obs.intensity,
      supportNeeded: obs.supportNeeded,
      durationMs: args.durationMs ?? null,
    },
  })
}

// ============================================================
// Prompt block — flagged trend varsa karakter dolaylı dürter
// ============================================================

export async function buildVoiceTrendBlock(args: {
  userId: string
  loveScore: number
  trustScore: number
}): Promise<string> {
  // Yakınlık eşiği (Replika riskine karşı sınırla)
  if (args.trustScore < 60) return ''

  // Flagged + henüz dile getirilmemiş trend
  const trend = await db.userVoiceTrend.findFirst({
    where: {
      userId: args.userId,
      flagged: true,
      flaggedAt: null,
    },
    orderBy: { windowEnd: 'desc' },
  })
  if (!trend) return ''

  return [
    '[KULLANICI SES TRENDİ — DOLAYLI DÜRTME]',
    `Son ${Math.round((trend.windowEnd.getTime() - trend.windowStart.getTime()) / (24 * 60 * 60 * 1000))} günde sesli mesajlarında yüksek stres sinyali var (${trend.highStressCount} kez yoğun).`,
    '',
    'Bir kez (sadece bir kez) dolaylı sor:',
    '- "Ya son zamanlarda çok gerginsin sanki, bişey mi var"',
    '- "Sesin biraz yorgun geliyor son zamanlarda, iyi misin"',
    '',
    'KURALLAR:',
    '- Bir kez sor. Kullanıcı geçiştirirse BIRAK. Israr yok.',
    '- ASLA terapist tonu / Replika klişesi:',
    '  * "Bu çok zorlu olmalı"',
    '  * "Kendine zaman ver"',
    '  * "Duygularını paylaş benimle"',
    '  * "Hatırla ki sen güçlüsün"',
    '- ASLA çözüm önerisi.',
    `- Bu mesajda dile getirirsen, sistem otomatik flaggedAt işaretleyecek (trend ID: ${trend.id}).`,
  ].join('\n')
}

// Karakter cevabında trend dile getirilmiş mi (basit pattern)
const VOICE_TREND_PATTERNS = [
  /\b(çok )?gerginsin\b/i,
  /\bsesin yorgun\b/i,
  /\bson zamanlarda.{0,20}(yorgun|gergin|stresli)/i,
]

export function detectVoiceTrendMention(characterReply: string): boolean {
  return VOICE_TREND_PATTERNS.some((p) => p.test(characterReply))
}

export async function markVoiceTrendFlaggedIfMentioned(args: {
  userId: string
  characterReply: string
}): Promise<void> {
  if (!detectVoiceTrendMention(args.characterReply)) return
  const trend = await db.userVoiceTrend.findFirst({
    where: { userId: args.userId, flagged: true, flaggedAt: null },
    orderBy: { windowEnd: 'desc' },
    select: { id: true },
  })
  if (!trend) return
  await db.userVoiceTrend.update({
    where: { id: trend.id },
    data: { flaggedAt: new Date() },
  })
}
