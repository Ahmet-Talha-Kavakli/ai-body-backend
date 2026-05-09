/**
 * V4.5 Madde 3 — OpenAI Whisper wrapper + ses tonu analizi
 *
 * Sadece metne çevirmez — kullanıcının nasıl konuştuğunu da çıkarır:
 *   - konuşma hızı (kelime/saniye)
 *   - duraksama sayısı/yoğunluğu
 *   - ses süresi vs metin uzunluğu (duygu yoğunluğu)
 *   - cümle parçalanma (kararsız/emin)
 *
 * Bu metadata Mia'nın system prompt'una `[KULLANICI SES TONU]` bloğu olarak
 * gider — Mia "neden böyle hissediyorsun?" demez, doğrudan anlar.
 */

const OPENAI_API = 'https://api.openai.com/v1'

export interface VoiceTone {
  // Konuşma hızı
  wordsPerSecond: number
  paceLabel: 'çok yavaş' | 'yavaş' | 'normal' | 'hızlı' | 'çok hızlı'
  // Duraksama
  pauseCount: number // segment arası uzun boşluk sayısı
  hesitationLevel: 'akıcı' | 'normal' | 'duraklamalı' | 'çok kararsız'
  // Yoğunluk
  intensityHint: 'sakin' | 'normal' | 'gergin' | 'yoğun'
  // Genel özet
  summary: string // "Sesi titrek, hızlı konuşuyor, kelime aralarında duraksamalar var" gibi
}

export interface STTResult {
  text: string
  durationSec: number
  language?: string
  tone: VoiceTone
}

interface WhisperSegment {
  id: number
  start: number
  end: number
  text: string
  no_speech_prob?: number
  avg_logprob?: number
}

function analyzeTone(text: string, durationSec: number, segments: WhisperSegment[]): VoiceTone {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const wps = durationSec > 0 ? wordCount / durationSec : 0

  let paceLabel: VoiceTone['paceLabel'] = 'normal'
  if (wps < 1) paceLabel = 'çok yavaş'
  else if (wps < 1.8) paceLabel = 'yavaş'
  else if (wps < 3) paceLabel = 'normal'
  else if (wps < 4) paceLabel = 'hızlı'
  else paceLabel = 'çok hızlı'

  // Duraksama: segment'ler arası > 0.6sn boşluk
  let pauseCount = 0
  for (let i = 1; i < segments.length; i++) {
    const gap = segments[i].start - segments[i - 1].end
    if (gap > 0.6) pauseCount++
  }
  const pauseRate = durationSec > 0 ? pauseCount / durationSec : 0
  let hesitationLevel: VoiceTone['hesitationLevel'] = 'normal'
  if (pauseRate < 0.05) hesitationLevel = 'akıcı'
  else if (pauseRate < 0.15) hesitationLevel = 'normal'
  else if (pauseRate < 0.3) hesitationLevel = 'duraklamalı'
  else hesitationLevel = 'çok kararsız'

  // Yoğunluk heuristik: hızlı + kararsız + uzun = gergin
  // Yavaş + akıcı + kısa = sakin
  let intensityHint: VoiceTone['intensityHint'] = 'normal'
  if ((paceLabel === 'hızlı' || paceLabel === 'çok hızlı') && hesitationLevel !== 'akıcı') {
    intensityHint = 'gergin'
  } else if (paceLabel === 'çok hızlı' && hesitationLevel === 'çok kararsız') {
    intensityHint = 'yoğun'
  } else if (paceLabel === 'çok yavaş' || paceLabel === 'yavaş') {
    intensityHint = 'sakin'
  }

  // Özet (Türkçe, doğal)
  const parts: string[] = []
  if (paceLabel !== 'normal') parts.push(`${paceLabel} konuşuyor`)
  if (hesitationLevel === 'duraklamalı' || hesitationLevel === 'çok kararsız') {
    parts.push(`${pauseCount} duraksama var`)
  } else if (hesitationLevel === 'akıcı') {
    parts.push('akıcı')
  }
  if (intensityHint !== 'normal') parts.push(`ton: ${intensityHint}`)
  const summary = parts.length > 0 ? parts.join(', ') : 'sakin ve doğal ton'

  return {
    wordsPerSecond: Number(wps.toFixed(2)),
    paceLabel,
    pauseCount,
    hesitationLevel,
    intensityHint,
    summary,
  }
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string = 'audio.m4a'
): Promise<STTResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')

  const formData = new FormData()
  const blob = new Blob([audioBuffer], { type: 'audio/m4a' })
  formData.append('file', blob, filename)
  formData.append('model', 'whisper-1')
  formData.append('language', 'tr')
  formData.append('response_format', 'verbose_json')
  formData.append('timestamp_granularities[]', 'segment')

  const res = await fetch(`${OPENAI_API}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Whisper failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = (data.text || '').trim()
  const durationSec = data.duration ?? 0
  const segments: WhisperSegment[] = data.segments || []
  const tone = analyzeTone(text, durationSec, segments)

  return {
    text,
    durationSec,
    language: data.language,
    tone,
  }
}

/**
 * Ton verisini system prompt'a basılacak metne çevirir.
 * Mia'ya hint: "kullanıcı böyle konuşuyor, anla ama soru sorma".
 */
export function toneToPromptBlock(tone: VoiceTone): string {
  return `[KULLANICI ŞU AN SESLİ MESAJ ATTI — KONUŞMA TONU]
Hız: ${tone.paceLabel} (${tone.wordsPerSecond} kelime/sn)
Akış: ${tone.hesitationLevel}${tone.pauseCount > 0 ? ` (${tone.pauseCount} duraksama)` : ''}
Yoğunluk: ${tone.intensityHint}
Özet: ${tone.summary}

ÖNEMLİ: Bu bilgiyi kullanarak doğal tepki ver. "Sesin titriyor, ne oldu?" gibi DOĞRUDAN gözlem yap, "nasıl hissediyorsun?" gibi terapist sorusu SORMA. Eğer ton normal/sakin ise tonu hiç bahsetme.`
}
