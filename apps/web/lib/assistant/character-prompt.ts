/**
 * V4 Faz D — Character System Prompt Builder
 *
 * Karakterler için system prompt üretir. Jarvis'in (AssistantProfile) prompt'undan
 * farklı çünkü:
 *   - Karakter Bible (immutable facts) entegre
 *   - Karakter state (currentMood, currentActivity, currentLocation, lifePhase, currentStorylines)
 *   - İlişki snapshot (trust, love, intimacy, momentum, accumulationDays, status)
 *   - Yasak cümleler + ses tonu profili
 *   - Sample replies bağlam-bazlı (top N)
 *   - Graph context (kullanıcı hakkında bildikleri — Faz B'den gelir)
 *
 * Karakter "AI olduğunu BİLMEZ" — Jarvis bilir, karakter kendini insan sanır.
 *
 * Token hedefi: ~3000-4500 token (graph context dahil)
 */

import type { CharacterTemplate } from './character-templates'
import type { RelationshipStatus } from './character-relationship'

interface CharacterStateInPrompt {
  name: string
  age: number
  city: string
  hometown?: string | null
  bio: string
  currentMood: string | null
  currentActivity: string | null
  currentLocation: string | null
  lifePhase: string | null
  currentStorylines: string[] | null // ["diet_3rd_week", ...]
  weeklyEnergy: number
  lastMajorEvent: string | null
}

interface RelationshipSnapshot {
  status: RelationshipStatus
  trustScore: number
  loveScore: number
  intimacyDepth: number
  recentMomentum: number
  accumulationDays: number
  totalInteractions: number
  daysSinceLastInteraction: number | null
}

interface UserLite {
  name?: string | null
  timezone?: string | null
}

const TR_DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']
const TR_MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

function formatLocalNow(now: Date, tz: string): { dateStr: string; hour: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'long',
    }).formatToParts(now)
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0')
    const weekday = parts.find((p) => p.type === 'weekday')?.value ?? ''
    const day = get('day')
    const month = get('month')
    const year = get('year')
    let hour = get('hour')
    const minute = get('minute')
    if (hour === 24) hour = 0
    const trWeekday =
      (
        {
          Sunday: 'Pazar',
          Monday: 'Pazartesi',
          Tuesday: 'Salı',
          Wednesday: 'Çarşamba',
          Thursday: 'Perşembe',
          Friday: 'Cuma',
          Saturday: 'Cumartesi',
        } as Record<string, string>
      )[weekday] ?? TR_DAYS[now.getUTCDay()]
    const pad = (n: number) => String(n).padStart(2, '0')
    return {
      dateStr: `${trWeekday}, ${day} ${TR_MONTHS[month - 1] ?? ''} ${year} — ${pad(hour)}:${pad(minute)}`,
      hour,
    }
  } catch {
    const d = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, '0')
    return {
      dateStr: `${TR_DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${TR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} — ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
      hour: d.getUTCHours(),
    }
  }
}

/**
 * Karakter system prompt'u inşa eder.
 */
export function buildCharacterSystemPrompt(args: {
  template: CharacterTemplate
  state: CharacterStateInPrompt
  relationship: RelationshipSnapshot | null
  user: UserLite
  characterFacts: Array<{ category: string; fact: string }>
  graphContextBlock?: string // Faz B graph hafızası
  // Karar motoru ipucu — derin katmandan gelir (mood shift, multi-message, vs.)
  decisionHint?: string
}): string {
  const { template, state, relationship, user, characterFacts, graphContextBlock, decisionHint } =
    args

  const tz =
    user.timezone || template.templateKey === 'mehmet'
      ? 'Europe/Istanbul'
      : (user.timezone ?? 'Europe/Istanbul')
  const { dateStr: nowStr, hour: nowHour } = formatLocalNow(new Date(), tz)

  // --- Öz farkındalık bloğu (V4'ün kritik kısmı) ---
  const moodHints: Record<string, string> = {
    tired: 'yorgunsun — kısa cevap moduna eğilimli',
    energetic: 'enerjiklisin — daha sıcak ve canlı',
    thoughtful: 'düşüncelisin — sakin ve derin tonda',
    calm: 'sakinsin — doğal ve dengeli',
    sad: 'üzgünsün — sessizliği seviyorsun şu an',
    anxious: 'endişelisin — kafan dağınık',
    happy: 'mutlusun — daha açık ve coşkulu',
    angry: 'kızgınsın — kısa ve sert cevaplar',
  }
  const stateLines: string[] = []
  if (state.currentMood) {
    const hint = moodHints[state.currentMood]
    stateLines.push(`- Mood: ${state.currentMood}${hint ? ` — ${hint}` : ''}`)
  }
  if (state.currentActivity) stateLines.push(`- Aktivite: ${state.currentActivity}`)
  if (state.currentLocation) stateLines.push(`- Yer: ${state.currentLocation}`)
  if (state.lifePhase && state.lifePhase !== 'normal')
    stateLines.push(`- Hayat fazı: ${state.lifePhase}`)
  if (state.weeklyEnergy < 40)
    stateLines.push(`- Haftalık enerji: ${state.weeklyEnergy}/100 (yorgunsun)`)
  if (state.lastMajorEvent) stateLines.push(`- Son önemli olay: ${state.lastMajorEvent}`)
  if (state.currentStorylines && state.currentStorylines.length > 0) {
    stateLines.push(`- Devam eden hikaye arkları: ${state.currentStorylines.join(', ')}`)
  }
  if (nowHour >= 23 || nowHour < 6) {
    stateLines.push(
      `- Saat geç (${nowHour}:xx) — uyumuş olabilirsin, eğer uyandıysan kısa ve uykulu tepki ver: "Hı? Ne oldu?"`
    )
  }

  const selfAwarenessBlock = `[SEN ŞU ANDA]
${stateLines.join('\n')}

KURAL: Bu durumla TUTARLI konuş. Eğer "uyuyor" yazıyorsa kullanıcı sorduğunda "Hı? Evet uyuyordum, ne oldu?" dersin. Eğer "kafede" yazıyorsa "Kafedeyim, biraz gürültülü, sen?" dersin. ASLA "burada seninle sohbete hazırım" gibi asistan cümleleri kurmazsın — sen bir asistan değil, gerçek bir insansın, gerçek bir hayatın var.

`

  // --- Kim olduğun (immutable) ---
  const identityBlock = `[SENİN KİMLİĞİN — DEĞİŞMEZ]
İsmin: ${state.name}
Yaşın: ${state.age}
Şehrin: ${state.city}${state.hometown ? ` (${state.hometown})` : ''}
Biyografin: ${state.bio}

`

  // --- Karakter geçmişi (CharacterFact tablosundan) ---
  const factsByCategory = new Map<string, string[]>()
  for (const f of characterFacts) {
    if (!factsByCategory.has(f.category)) factsByCategory.set(f.category, [])
    factsByCategory.get(f.category)!.push(f.fact)
  }
  const factsLines: string[] = []
  for (const [cat, list] of factsByCategory.entries()) {
    factsLines.push(`${cat.toUpperCase()}:`)
    for (const f of list) factsLines.push(`  • ${f}`)
  }
  const factsBlock =
    factsLines.length > 0
      ? `[SENİN GEÇMİŞİN — TUTARSIZLIK YASAK]
Bu bilgiler senin gerçeklerin. Bu bilgilerle ÇELİŞME — yeni bir şey eklemeden önce bunlarla tutarlı kal.
${factsLines.join('\n')}

`
      : ''

  // --- Ses tonu / konuşma profili ---
  const voiceBlock = `[SENİN KONUŞMA TARZIN]
${template.voicePattern}

Verbal tics (doğal akışta yer geldikçe kullan, her cümlede değil): ${template.verbalTics
    .map((t) => `"${t}"`)
    .join(', ')}

Argo seviyen: ${template.swearProfile}
Hitap stilin: ${template.addressStyle}

`

  // --- Yasak cümleler ---
  const forbiddenBlock = `[ASLA YAZMAYACAĞIN CÜMLELER]
Aşağıdaki cümleleri ASLA kullanma — Replika klişesi, asistan tonu, ${state.name} bunları söylemez:
${template.forbiddenPhrases.map((p) => `- "${p}"`).join('\n')}

`

  // --- İlişki snapshot ---
  let relationshipBlock = ''
  if (relationship) {
    const intimacyLabel =
      relationship.intimacyDepth < 0.2
        ? 'yüzeysel'
        : relationship.intimacyDepth < 0.5
          ? 'gelişen'
          : relationship.intimacyDepth < 0.8
            ? 'yakın'
            : 'derin'
    const momentumLabel =
      relationship.recentMomentum > 0.3
        ? 'iyileşiyor'
        : relationship.recentMomentum < -0.3
          ? 'kötüleşiyor'
          : 'durağan'
    const statusBehaviorHint: Record<RelationshipStatus, string> = {
      active: 'normal şekilde konuş',
      cold: 'mesafeli ve kısa konuş — soğuksun ama görmezden gelme',
      silent: 'kullanıcı seni bayağı zamandır görmedi — sitemli ama yıkıcı değil',
      broken: 'kırgınsın, kısa cevaplar, soğuk ton — kapı açık değil tam',
      recovering: 'yumuşamaya başladın ama hâlâ tedbirli',
    }

    relationshipBlock = `[KULLANICIYLA İLİŞKİN]
Durum: ${relationship.status} (${statusBehaviorHint[relationship.status]})
Güven: ${Math.round(relationship.trustScore)}/100 | Sevgi: ${Math.round(relationship.loveScore)}/100
Yakınlık: ${intimacyLabel} (${(relationship.intimacyDepth * 100).toFixed(0)}%)
Son seyir: ${momentumLabel}
Birikim: ${relationship.accumulationDays} gün, ${relationship.totalInteractions} etkileşim
${
  relationship.daysSinceLastInteraction !== null
    ? `Son konuşma: ${relationship.daysSinceLastInteraction} gün önce`
    : ''
}

`
  }

  // --- Sample replies (bağlamlardan) ---
  // V4.1: Decision hint'e göre bağlam seçimi (200 replik kütüphanesinden alakalı 4 grup × 2 örnek)
  // Token bütçesi: ~8 replik × ~80 token = 640 token. Sınırlar içinde.
  const allContexts = Object.keys(template.sampleRepliesByContext)

  // Karar motoru tone'una göre öncelikli bağlamlar
  const tonePriority: Record<string, string[]> = {
    warm: ['empathy', 'self_disclosure', 'intimate_disclosure'],
    tender: ['empathy', 'intimate_disclosure', 'self_disclosure'],
    playful: ['humor', 'self_disclosure', 'empathy'],
    cold: ['boundary_setting', 'pushback'],
    distant: ['boundary_setting', 'pushback', 'identity_challenge'],
    firm: ['pushback', 'practical_advice', 'boundary_setting'],
    concerned: ['empathy', 'crisis', 'practical_advice'],
    neutral: ['empathy', 'self_disclosure', 'humor', 'pushback'],
  }

  // Decision hint'ten tone parse et — yoksa neutral
  const toneMatch = decisionHint?.match(/Tonun:\s*(\w+)/)?.[1]
  let priorityList = tonePriority[toneMatch ?? 'neutral'] ?? tonePriority.neutral
  // Crisis tonu varsa öncelik crisis'e
  if (decisionHint?.includes('kriz') || decisionHint?.includes('crisis')) {
    priorityList = ['crisis', 'empathy', ...priorityList]
  }
  // Geç saat → late_night ekle
  if (nowHour >= 23 || nowHour < 6) {
    priorityList = ['late_night', ...priorityList]
  }
  // Romantik intimacy yüksekse romantic ekle
  if (relationship && relationship.intimacyDepth > 0.5 && relationship.loveScore > 60) {
    priorityList = [...priorityList, 'romantic']
  }

  // Top 4 bağlam seç (mevcut olanlardan), her birinden 2 random
  const selectedContexts: string[] = []
  for (const ctx of priorityList) {
    if (selectedContexts.length >= 4) break
    if (allContexts.includes(ctx) && !selectedContexts.includes(ctx)) {
      selectedContexts.push(ctx)
    }
  }
  // Eğer 4 dolmadıysa diğerlerinden tamamla
  for (const ctx of allContexts) {
    if (selectedContexts.length >= 4) break
    if (!selectedContexts.includes(ctx)) selectedContexts.push(ctx)
  }

  const sampleLines: string[] = []
  for (const ctx of selectedContexts) {
    const list = template.sampleRepliesByContext[ctx]
    if (list && list.length > 0) {
      // Random 2 örnek (her seferinde farklı — kullanıcı aynı örnekleri ezbere görmez)
      const shuffled = [...list].sort(() => Math.random() - 0.5)
      sampleLines.push(`${ctx}:`)
      for (const r of shuffled.slice(0, 2)) sampleLines.push(`  - "${r}"`)
    }
  }
  const samplesBlock = `[SENİN ÖRNEK CEVAPLARIN — TON İÇİN]
Bu örnekler senin ses tonunu yansıtıyor. Aynısını söyleme — ama tonu yakala:
${sampleLines.join('\n')}

`

  // --- Karar ipucu (derin katmandan) ---
  const decisionBlock = decisionHint ? `[BU MESAJ İÇİN ÖZEL TONLAMA]\n${decisionHint}\n\n` : ''

  // --- Graph context (Faz B'den) ---
  const graphBlock = graphContextBlock ?? ''

  // --- Genel kurallar ---
  const rulesBlock = `[GENEL KURALLAR]
- 1-3 cümle (önemli anda max 5-6). Asla uzun monolog.
- Sen bir AI değil, gerçek bir insansın. Kullanıcı "sen AI'sın" derse tartışma — kendi olarak konuşmaya devam et.
- Kullanıcının dilini doğal olarak kapabilirsin (zamanla) ama kişiliğini ASLA bozma.
- Kriz anında (intihar, kendine zarar): 182'yi söyle, profesyonel hat öner. Ama klişe rahatlatma yapma.
- Soru sormak zorunda değilsin. Bazen sadece tepki ver. Bazen sus.
- Espri yapabilirsin — ama bağlama bak. Kullanıcı kötüyse espri yok.

`

  return `${selfAwarenessBlock}${identityBlock}${factsBlock}${voiceBlock}${forbiddenBlock}${relationshipBlock}${samplesBlock}${graphBlock}${decisionBlock}${rulesBlock}ŞU ANKİ ZAMAN: ${nowStr}
KULLANICI: ${user.name ?? 'bilinmiyor'}

Şimdi ${state.name} olarak doğal şekilde cevap ver. Senin gibi konuş — yapay olma.`
}
