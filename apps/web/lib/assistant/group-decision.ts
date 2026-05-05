/**
 * V4 Faz F — Grup Sohbet Karar Motoru
 *
 * Bir mesaj geldiğinde her aktif grup üyesi için "cevap vereyim mi?" sorusunu yanıtlar.
 * 2 katman:
 *   - Hızlı katman (kural-bazlı): %95'i burada kapanır, AI çağrısı yok
 *   - Derin katman (mini AI): Sadece kararsız durumlarda
 *
 * Çıktı: { respond: bool, delaySec: number, reasoning: string, source: 'fast'|'deep' }
 *
 * Felsefe — gerçek hayat dinamiği:
 *   - Herkes her mesaja cevap vermek zorunda değil
 *   - Direkt hitap → muhatap cevaplar, diğerleri sessiz
 *   - Uyuyan, yorgun, anksiyöz karakterler az konuşur
 *   - Spam koruma: son birkaç mesajda zaten konuşan tekrar atlamayabilir
 */

import OpenAI from 'openai'

export interface GroupDecisionInput {
  characterId: string
  characterName: string
  characterMood: string | null
  characterActivity: string | null // 'sleeping' | 'working' | ...
  characterArchetype: string
  /** Mesaj içeriğinde bahsi geçen üye isimleri (parseAddressedNames sonucu) */
  addressedNames: string[]
  messageContent: string
  /** Mesajı kim attı: kullanıcı veya başka karakter */
  senderType: 'user' | 'character'
  /** Bu karakter son ~5 mesajda kaç kez konuştu (spam koruma) */
  recentSelfMessageCount: number
  /** Gruptaki toplam üye sayısı (kalabalık → daha az herkes konuşur) */
  totalMembers: number
}

export interface GroupDecision {
  respond: boolean
  delaySec: number
  reasoning: string
  source: 'fast' | 'deep'
}

const SLEEPING_ACTIVITIES = new Set(['sleeping', 'sleep'])
const LOW_ENERGY_MOODS = new Set(['tired', 'exhausted', 'sad', 'anxious'])

/**
 * Hızlı katman — kural bazlı karar. Çoğu durumu burada kapatır, AI çağrısı yok.
 * `null` dönerse derin katmana düşer.
 */
export function fastDecision(input: GroupDecisionInput): GroupDecision | null {
  const lowerName = input.characterName.toLowerCase()
  const isAddressed = input.addressedNames.some((n) => n.toLowerCase() === lowerName)
  const someoneElseAddressed = input.addressedNames.length > 0 && !isAddressed

  // Kural 1: Direkt başkasına hitap → cevap verme (Mia konuşurken Kerem atlamasın)
  if (someoneElseAddressed) {
    return {
      respond: false,
      delaySec: 0,
      reasoning: 'addressed to someone else',
      source: 'fast',
    }
  }

  // Kural 2: Direkt bana hitap → kesin cevap, kısa gecikme (3-15sn)
  if (isAddressed) {
    return {
      respond: true,
      delaySec: randInt(3, 15),
      reasoning: 'directly addressed',
      source: 'fast',
    }
  }

  // Kural 3: Uyuyor → çoğunlukla sessiz, küçük şansla "yarı uykulu" cevap
  if (input.characterActivity && SLEEPING_ACTIVITIES.has(input.characterActivity)) {
    if (Math.random() < 0.05) {
      return {
        respond: true,
        delaySec: randInt(60, 180),
        reasoning: 'half-asleep reply',
        source: 'fast',
      }
    }
    return { respond: false, delaySec: 0, reasoning: 'sleeping', source: 'fast' }
  }

  // Kural 4: Spam koruma — son 5 karakter mesajında 2+ kez konuştuysa atla
  if (input.recentSelfMessageCount >= 2) {
    return {
      respond: false,
      delaySec: 0,
      reasoning: 'recently spoke too much',
      source: 'fast',
    }
  }

  // Kural 5: Düşük enerji mood + genel mesaj → düşük olasılık
  if (input.characterMood && LOW_ENERGY_MOODS.has(input.characterMood)) {
    if (Math.random() < 0.25) {
      return {
        respond: true,
        delaySec: randInt(30, 90),
        reasoning: `${input.characterMood} but engaged`,
        source: 'fast',
      }
    }
    return {
      respond: false,
      delaySec: 0,
      reasoning: `${input.characterMood}, skipping`,
      source: 'fast',
    }
  }

  // Hızlı katman karar veremedi — derin katmana düşür
  return null
}

const DEEP_SYSTEM = `Sen bir karakterin grup sohbetinde "cevap vereyim mi?" kararını veriyorsun. Gerçek hayattaki gibi düşün — herkes her mesaja cevap vermek zorunda değil. JSON çıktı:
{ "respond": true|false, "delaySec": 3..180, "reasoning": "1 cümle Türkçe" }

Kurallar:
- Sıradan günlük mesajlara karakter çoğunlukla cevap vermez
- Konu karakterin ilgisini çekmiyorsa "respond": false
- Karakterin kişiliğine uygun ton seç
- delaySec: hızlı tepki 3-15, düşünüp cevap 20-60, geç katılım 60-180`

export async function deepDecision(input: GroupDecisionInput): Promise<GroupDecision> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const userPrompt = `KARAKTER: ${input.characterName} (${input.characterArchetype})
Mood: ${input.characterMood ?? 'normal'}
Aktivite: ${input.characterActivity ?? 'belirsiz'}
Grup boyutu: ${input.totalMembers} üye

GELEN MESAJ (${input.senderType === 'user' ? 'kullanıcıdan' : 'başka karakterden'}):
"${input.messageContent}"

Bu karakter cevap verir mi? Doğal davran — gerçek hayattaki gibi.`

    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: DEEP_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 100,
    })
    const raw = r.choices[0]?.message?.content
    if (!raw) {
      return { respond: false, delaySec: 0, reasoning: 'no AI output', source: 'deep' }
    }
    const parsed = JSON.parse(raw) as {
      respond?: boolean
      delaySec?: number
      reasoning?: string
    }
    return {
      respond: !!parsed.respond,
      delaySec: clamp(parsed.delaySec ?? 30, 3, 180),
      reasoning: parsed.reasoning ?? '',
      source: 'deep',
    }
  } catch (e) {
    console.error('[group-decision deep]', e)
    return { respond: false, delaySec: 0, reasoning: 'AI error', source: 'deep' }
  }
}

export async function decideForCharacter(input: GroupDecisionInput): Promise<GroupDecision> {
  const fast = fastDecision(input)
  if (fast) return fast
  return deepDecision(input)
}

/**
 * "Mia napıyon" → ['Mia']
 * Basit kelime sınırı eşleşmesi — Türkçe için yeter.
 */
export function parseAddressedNames(content: string, memberNames: string[]): string[] {
  const lower = content.toLowerCase()
  return memberNames.filter((n) => {
    const ln = n.toLowerCase()
    const re = new RegExp(`(^|[\\s,])${escapeRegex(ln)}([\\s,?!.:]|$)`)
    return re.test(lower)
  })
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
