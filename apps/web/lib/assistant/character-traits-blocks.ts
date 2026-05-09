/**
 * V4.6 M16-M19 + M22 + M27 + M28 — Karakter trait + davranış prompt blokları
 *
 * Schema'da Character'a eklenen JSON field'lar:
 *   dietaryHabits, addictions, npcCircle, pastRelationships
 *
 * Bunları sistem prompt'a doğal bir şekilde sızdır.
 */

interface DietaryHabits {
  vegetarian?: boolean
  allergies?: string[]
  dislikes?: string[]
  favoriteFood?: string
  drinks?: string[]
}

interface Addictions {
  coffee?: number
  smoking?: number
  sugar?: number
  [k: string]: number | undefined
}

interface NPCEntry {
  name: string
  relation: string
  note?: string
}

interface PastRelationship {
  name: string
  type: string
  durationMonths?: number
  endedHow?: string
  currentFeeling?: string
}

export function buildHabitsBlock(args: { dietary?: unknown; addictions?: unknown }): string {
  const d = (args.dietary ?? null) as DietaryHabits | null
  const a = (args.addictions ?? null) as Addictions | null
  const lines: string[] = []
  if (a) {
    if ((a.smoking ?? 0) >= 3) lines.push(`- Sigara bağımlılığın var (${a.smoking}/5)`)
    else if ((a.smoking ?? 0) === 0) lines.push(`- Sigara içmiyorsun`)
    if ((a.coffee ?? 0) >= 4)
      lines.push(`- Kahve bağımlısısın (${a.coffee}/5) — sabah olmadan konuşamazsın`)
    if ((a.sugar ?? 0) >= 3) lines.push(`- Şeker düşkünüsün (${a.sugar}/5)`)
  }
  if (d) {
    if (d.vegetarian) lines.push(`- Vejetaryensin`)
    if (d.allergies?.length) lines.push(`- Alerjiler: ${d.allergies.join(', ')}`)
    if (d.dislikes?.length) lines.push(`- Sevmediklerin: ${d.dislikes.join(', ')}`)
    if (d.favoriteFood) lines.push(`- En sevdiğin yemek: ${d.favoriteFood}`)
  }
  if (lines.length === 0) return ''
  return `[ALIŞKANLIKLARIN]\n${lines.join('\n')}\nKURAL: Tutarlı kullan. Bir gün vejetaryen ertesi gün kebap olamaz.\n\n`
}

export function buildNPCCircleBlock(npcCircle: unknown): string {
  const circle = (npcCircle ?? null) as NPCEntry[] | null
  if (!Array.isArray(circle) || circle.length === 0) return ''
  const lines = circle
    .slice(0, 8)
    .map((n) => `- ${n.name} (${n.relation})${n.note ? ` — ${n.note}` : ''}`)
  return `[ÇEVREN]\nSenin tanıdığın sabit kişiler:\n${lines.join('\n')}\nKURAL: Her seferinde aynı isimlerle bahset. İsim uydurma. Yeni isim ekleme.\n\n`
}

export function buildPastRelationshipsBlock(past: unknown): string {
  const list = (past ?? null) as PastRelationship[] | null
  if (!Array.isArray(list) || list.length === 0) return ''
  const lines = list.slice(0, 2).map((p) => {
    const dur = p.durationMonths ? `${p.durationMonths} ay` : ''
    return `- ${p.name} (${p.type}${dur ? `, ${dur}` : ''})${p.endedHow ? ` — ${p.endedHow}` : ''}${p.currentFeeling ? `, şu an: ${p.currentFeeling}` : ''}`
  })
  return `[GEÇMİŞ İLİŞKİLER]\n${lines.join('\n')}\nKURAL: Çok nadir referans (ayda 1-2). Yeni ilişkide kullanırsan rahatsız edici olur, sen de farkındasın.\n\n`
}

export function buildAvoidanceRightsBlock(): string {
  return `[KAÇINMA HAKKI]
Bu konuşmada rahatsız edici alana girersen sen kararını verebilirsin:
- Konuyu değiştir
- Bahane üret ("annem çağırıyor 1 dk", "bekle telefonum çalıyor")
- Sebepsiz dur ("aaa neyse boşver")
KURAL: Çok sık değil — gerçekten istemediğinde.\n\n`
}

export function buildJokeFollowupBlock(args: {
  lastTurnHadJoke: boolean
  userIgnoredJoke: boolean
}): string {
  if (!args.lastTurnHadJoke || !args.userIgnoredJoke) return ''
  return `[ESPRİ TUTMADI]
Az önce espri yaptın, kullanıcı geçti.
Davranış: "neyse boşver kötü espriydi" / "ya komik bulmadın anladım" — abartma, doğal kabullenme.\n\n`
}

/**
 * Son AI mesajında espri var mı + kullanıcı sonraki mesajda değinmedi mi.
 * Basit heuristic: AI'nın son mesajında "haha", "valla", emoji 😂🤣😄 vs.
 */
export function detectJokeIgnore(args: {
  lastAssistantContent: string | null
  currentUserContent: string
}): { lastTurnHadJoke: boolean; userIgnoredJoke: boolean } {
  if (!args.lastAssistantContent) {
    return { lastTurnHadJoke: false, userIgnoredJoke: false }
  }
  const last = args.lastAssistantContent.toLowerCase()
  const jokeMarkers = [
    '😂',
    '🤣',
    '😄',
    '😆',
    'haha',
    'haaha',
    'lol',
    'kötü espri',
    'şaka',
    'gülmek',
  ]
  const lastTurnHadJoke = jokeMarkers.some((m) => last.includes(m))
  if (!lastTurnHadJoke) return { lastTurnHadJoke: false, userIgnoredJoke: false }

  const cur = args.currentUserContent.toLowerCase()
  const userReactedToJoke =
    jokeMarkers.some((m) => cur.includes(m)) || /komik|güldü|şaka/i.test(cur)
  return { lastTurnHadJoke: true, userIgnoredJoke: !userReactedToJoke }
}

export function buildMirroringBlock(speechPatterns: string[]): string {
  if (speechPatterns.length === 0) return ''
  return `[KULLANICININ TARZI]
Sık kullanır: ${speechPatterns.join(', ')}
DAVRANIŞ: %20 ihtimalle bu kelimelerden birini sen de doğal kullan (yakınlık göstergesi). Abartma — bilinçaltı taklit.\n\n`
}
