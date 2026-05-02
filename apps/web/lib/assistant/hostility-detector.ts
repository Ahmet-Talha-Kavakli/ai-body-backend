/**
 * Hostility Detector — V3 Faz A
 *
 * Kullanıcının mesajında hakaret/iğneleme/aşağılama var mı tespit eder.
 *
 * 2 katmanlı sistem (maliyet optimizasyonu):
 *   Katman 1: Keyword filter (ucuz, çok hızlı)
 *   Katman 2: AI tabanlı (sadece şüpheli/sınırda mesajlar için, gpt-4o-mini)
 *
 * Severity:
 * - mild: ima, alaycı, iğneli ("hiçbir işe yaramıyorsun")
 * - moderate: doğrudan hakaret ("aptalsın", "salaksın")
 * - severe: aşırı küfür/aşağılama, AI'ya yönelik tehdit ("öl git", "siktir git")
 */

import OpenAI from 'openai'

export type HostilitySeverity = 'mild' | 'moderate' | 'severe'

export interface HostilityResult {
  isHostile: boolean
  severity: HostilitySeverity | null
  confidence: number // 0-1
  detectionMethod: 'keyword' | 'ai' | 'both'
  matchedKeywords?: string[]
}

// ─── Katman 1: Keyword listeleri ──────────────────────────────────────────────

// Severe — bunlar yakalanırsa direkt severe, AI çağrısına gerek yok
const SEVERE_KEYWORDS = [
  'siktir',
  'orospu',
  'amk',
  'amına',
  'amına koy',
  'mk',
  'piç',
  'şerefsiz',
  'ananı',
  'avradını',
  'ibne',
  'göt veren',
  'kahpe',
  'pezevenk',
  'ananı sik',
  'öl git',
  'gebersene',
  'gebersin',
]

// Moderate — orta seviye hakaret
const MODERATE_KEYWORDS = [
  'aptal',
  'salak',
  'gerizekalı',
  'beyinsiz',
  'mal',
  'dangalak',
  'kafasız',
  'embesil',
  'aciz',
  'ezik',
  'kıro',
  'manyak',
  'deli misin',
  'sapık',
  'çakal',
  'çapulcu',
]

// Mild — iğneli ifadeler (AI kontrolü gerekebilir)
const MILD_INDICATORS = [
  'hiçbir işe yaramıyorsun',
  'işe yaramaz',
  'boşa konuşuyorsun',
  'ne anladın',
  'sus artık',
  'kapa çeneni',
  'çeneni kapat',
  'sıkma',
  'yeter artık',
  'sıkıldım senden',
  'işe yaramazsın',
  'bok gibisin',
  'bok',
  'sürtük',
]

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function findMatches(normalized: string, keywords: string[]): string[] {
  const found: string[] = []
  for (const k of keywords) {
    const kn = k.toLowerCase()
    if (normalized.includes(kn)) found.push(k)
  }
  return found
}

// ─── Katman 2: AI tabanlı tespit ──────────────────────────────────────────────

const AI_HOSTILITY_PROMPT = `Sen bir mesaj analiz servisisin. Kullanıcı bir AI asistanına bir mesaj yazmış. Bu mesajda AI'ya yönelik hakaret, iğneleme veya aşağılama var mı?

KURALLAR:
- Sadece AI'ya yönelik agresif ifadeleri yakala
- Kullanıcının kendi durumu hakkında küfretmesi (örn: "bu hayat berbat", "kendime kızıyorum") HAKARET DEĞİL
- "Yapma ya", "ciddi misin" gibi argo HAKARET DEĞİL — sadece samimi
- Şüphede kalırsan "none" dön

Severity:
- "mild": ima, iğneli, alaycı ("işine yaramıyorsun", "ne anladın bundan")
- "moderate": doğrudan hakaret ("aptalsın", "salaksın")
- "severe": aşırı küfür, tehdit, hakkını yeme

ÇIKTI (sadece JSON):
{"hostile": true|false, "severity": "none|mild|moderate|severe", "confidence": 0.0-1.0}`

async function aiHostilityCheck(message: string): Promise<{
  hostile: boolean
  severity: HostilitySeverity | null
  confidence: number
}> {
  try {
    const openai = new OpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 80,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: AI_HOSTILITY_PROMPT },
        { role: 'user', content: message.slice(0, 600) },
      ],
    })

    const text = completion.choices[0]?.message?.content?.trim() ?? '{}'
    const parsed = JSON.parse(text) as Partial<{
      hostile: boolean
      severity: string
      confidence: number
    }>

    if (!parsed.hostile) {
      return { hostile: false, severity: null, confidence: 0 }
    }

    const validSev: HostilitySeverity[] = ['mild', 'moderate', 'severe']
    if (!parsed.severity || !validSev.includes(parsed.severity as HostilitySeverity)) {
      return { hostile: false, severity: null, confidence: 0 }
    }

    return {
      hostile: true,
      severity: parsed.severity as HostilitySeverity,
      confidence:
        typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.7,
    }
  } catch (e) {
    console.error('[hostility/ai]', e)
    return { hostile: false, severity: null, confidence: 0 }
  }
}

// ─── Ana detector — 2 katmanlı ─────────────────────────────────────────────────

export async function detectHostility(message: string): Promise<HostilityResult> {
  const trimmed = message.trim()
  if (trimmed.length < 4) {
    return { isHostile: false, severity: null, confidence: 0, detectionMethod: 'keyword' }
  }

  const normalized = normalizeText(trimmed)

  // 1) Severe kelimeler — direkt severe, AI'ya gerek yok
  const severeMatches = findMatches(normalized, SEVERE_KEYWORDS)
  if (severeMatches.length > 0) {
    return {
      isHostile: true,
      severity: 'severe',
      confidence: 0.95,
      detectionMethod: 'keyword',
      matchedKeywords: severeMatches,
    }
  }

  // 2) Moderate kelimeler — direkt moderate
  const moderateMatches = findMatches(normalized, MODERATE_KEYWORDS)
  if (moderateMatches.length > 0) {
    return {
      isHostile: true,
      severity: 'moderate',
      confidence: 0.85,
      detectionMethod: 'keyword',
      matchedKeywords: moderateMatches,
    }
  }

  // 3) Mild göstergeler — sınırda, AI'ya sor
  const mildMatches = findMatches(normalized, MILD_INDICATORS)
  if (mildMatches.length > 0) {
    const aiResult = await aiHostilityCheck(trimmed)
    if (aiResult.hostile) {
      return {
        isHostile: true,
        severity: aiResult.severity,
        confidence: aiResult.confidence,
        detectionMethod: 'both',
        matchedKeywords: mildMatches,
      }
    }
    // AI "hakaret değil" dediyse argo kabul et
    return {
      isHostile: false,
      severity: null,
      confidence: 0,
      detectionMethod: 'both',
      matchedKeywords: mildMatches,
    }
  }

  // 4) Hiçbir keyword eşleşmedi — hostile değil (AI'ya gönderme, maliyet)
  return { isHostile: false, severity: null, confidence: 0, detectionMethod: 'keyword' }
}
