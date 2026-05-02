/**
 * V2 Faz N: Multi-model router.
 * Her mesajı analiz edip "easy/medium/hard" karar verir + ihtiyaç duyulan tool kategorilerini bulur.
 * Easy/medium → gpt-4o-mini (ucuz). Hard → gpt-4o.
 *
 * Router'ın kendisi gpt-4o-mini'de çalışır (çok ucuz). Yanlış kararsa fallback hard'a.
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type RouteDifficulty = 'easy' | 'medium' | 'hard'

export type ToolCategory =
  | 'health'
  | 'water'
  | 'sleep'
  | 'medication'
  | 'nutrition'
  | 'activity'
  | 'body'
  | 'mood'
  | 'memory'
  | 'people'
  | 'reminder'
  | 'environment'
  | 'healthkit'
  | 'calendar'
  | 'contacts'
  | 'finance'
  | 'productivity'
  | 'career'
  | 'hobby'
  | 'sports'
  | 'travel'
  | 'home'
  | 'tools_actions'

export interface RouteDecision {
  difficulty: RouteDifficulty
  toolCategories: ToolCategory[]
  needsMemoryRecall: boolean // RAG context gerekli mi
  reasoning: string // debug için
  tokensUsed?: number
}

// Kriz/güvenlik anahtar kelimeleri — bunlar görünürse direkt hard.
const CRISIS_KEYWORDS = [
  'ölmek',
  'intihar',
  'kendime zarar',
  'yaşamak istemiyorum',
  'değersizim',
  'hiç kimse beni',
  'kayboldum',
  'çok kötüyüm',
  'panik atak',
  'panik',
  'bittim',
  'ne yapsam bilmiyorum',
]

// Duygu/derinlik kelimeleri — hard işareti
const EMOTION_KEYWORDS = [
  'üzgün',
  'mutsuz',
  'yorgun',
  'tükendim',
  'depresif',
  'stresli',
  'kaygılı',
  'korkuyorum',
  'yalnızım',
  'kızgınım',
  'sinirli',
  'neden ben',
  'ne yapmalıyım',
  'anlamıyorum',
  'kafam karışık',
  'düşünüyorum',
  'hissediyorum',
]

// Hızlı sinyal tabanlı pre-classification (LLM çağırmadan önce)
function fastClassify(text: string): { hint: RouteDifficulty | null; reason: string } {
  const lower = text.toLowerCase().trim()

  // Crisis → hard
  for (const kw of CRISIS_KEYWORDS) {
    if (lower.includes(kw)) return { hint: 'hard', reason: `crisis_keyword:${kw}` }
  }

  // Çok kısa mesajlar
  if (lower.length < 4) return { hint: 'easy', reason: 'too_short' }
  if (lower.split(/\s+/).length <= 3 && !lower.includes('?')) {
    return { hint: 'easy', reason: 'few_words' }
  }

  // Selamlamalar
  const greetings = [
    'merhaba',
    'selam',
    'günaydın',
    'iyi akşamlar',
    'iyi geceler',
    'naber',
    'nasılsın',
  ]
  if (greetings.some((g) => lower.includes(g)) && lower.length < 30) {
    return { hint: 'easy', reason: 'greeting' }
  }

  // Onaylar
  const acks = ['tamam', 'ok', 'okey', 'evet', 'hayır', 'tabii', 'olur', 'sağol', 'teşekkür']
  if (acks.some((a) => lower === a || lower.startsWith(a + ' ') || lower.endsWith(' ' + a))) {
    if (lower.length < 30) return { hint: 'easy', reason: 'acknowledgment' }
  }

  // Duygu kelimeleri → hard
  for (const kw of EMOTION_KEYWORDS) {
    if (lower.includes(kw)) return { hint: 'hard', reason: `emotion_keyword:${kw}` }
  }

  // Uzun mesaj (>200 char) genelde derinlik gerektirir
  if (text.length > 200) return { hint: 'hard', reason: 'long_message' }

  return { hint: null, reason: 'no_fast_signal' }
}

// LLM router — fast classify yetmediğinde kullanılır.
async function llmClassify(args: {
  message: string
  recentContext: string
}): Promise<RouteDecision> {
  const sysPrompt = `Sen bir mesaj sınıflandırıcısın. Kullanıcının yazdığı mesajı analiz et.

Difficulty seviyeleri:
- "easy": Selamlama, basit onay/red, kısa veri sorgusu, basit log ("$40 yedim"), tek tool çağrısı yeterli
- "medium": 1-2 tool çağrısı, kısa cevap, listeleme, güncelleme, kayıt, liste filtresi
- "hard": Duygusal destek, kriz, çok adımlı reasoning, yorumlama, "neden", "ne yapmalıyım", uzun analiz, plan yapma

Tool kategorileri (gerekenleri seç, JSON array):
- health, water, sleep, medication, nutrition, activity, body, mood, memory, people, reminder, environment, healthkit, calendar, contacts, finance, productivity, career, hobby, sports, travel, home, tools_actions

needsMemoryRecall: Eğer kullanıcının geçmişinden bir bilgiyi hatırlamak gerekirse true ("annemden bahsetmiştim", "önceden..." gibi).

JSON döndür:
{"difficulty": "easy|medium|hard", "toolCategories": [...], "needsMemoryRecall": boolean, "reasoning": "kısa açıklama"}`

  const userPrompt = `Mesaj: "${args.message}"
${args.recentContext ? `Son konuşma bağlamı: ${args.recentContext}` : ''}`

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.1,
    })
    const raw = res.choices[0]?.message?.content
    if (!raw) throw new Error('no_response')
    const parsed = JSON.parse(raw) as {
      difficulty: RouteDifficulty
      toolCategories: ToolCategory[]
      needsMemoryRecall?: boolean
      reasoning?: string
    }
    return {
      difficulty: parsed.difficulty,
      toolCategories: parsed.toolCategories ?? [],
      needsMemoryRecall: parsed.needsMemoryRecall ?? false,
      reasoning: parsed.reasoning ?? 'llm_classified',
      tokensUsed: res.usage?.total_tokens ?? 0,
    }
  } catch (e) {
    console.error('[router/llm]', e)
    // Fallback: hard (güvenli taraf)
    return {
      difficulty: 'hard',
      toolCategories: [],
      needsMemoryRecall: true,
      reasoning: 'llm_failed_fallback_hard',
    }
  }
}

/**
 * Bir kullanıcı mesajını route et.
 * Önce hızlı kural-bazlı, hint kesinse direkt döner.
 * Yoksa LLM'e sor.
 */
export async function routeMessage(args: {
  message: string
  recentContext?: string
}): Promise<RouteDecision> {
  const fast = fastClassify(args.message)

  // Crisis → her zaman hard, LLM'e bile sormaya gerek yok
  if (fast.reason.startsWith('crisis_keyword')) {
    return {
      difficulty: 'hard',
      toolCategories: ['mood', 'people', 'memory'],
      needsMemoryRecall: true,
      reasoning: fast.reason,
    }
  }

  // Hint çok güçlü ve emin (selamlama, onay, çok kısa) → LLM'e sormadan döndür
  if (
    fast.hint === 'easy' &&
    ['too_short', 'few_words', 'greeting', 'acknowledgment'].includes(fast.reason)
  ) {
    return {
      difficulty: 'easy',
      toolCategories: [],
      needsMemoryRecall: false,
      reasoning: fast.reason,
    }
  }

  // Diğer durumlarda LLM router'a sor
  return llmClassify({ message: args.message, recentContext: args.recentContext ?? '' })
}

/**
 * Karar verilen difficulty'e göre OpenAI model adı.
 */
export function modelForDifficulty(d: RouteDifficulty): string {
  if (d === 'hard') return 'gpt-4o'
  return 'gpt-4o-mini' // easy + medium
}

/**
 * Difficulty + uzunluk → max output tokens (cevabı sınırla).
 */
export function maxTokensForDifficulty(d: RouteDifficulty): number {
  if (d === 'easy') return 300
  if (d === 'medium') return 600
  return 1200 // hard
}
