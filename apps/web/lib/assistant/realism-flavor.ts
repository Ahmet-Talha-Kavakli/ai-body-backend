/**
 * V4.5 Faz 13B + 13C — Mikro Realizm Lezzetleri
 *
 * 13B — İç Çelişki: Karakter sürekli kararlı/net konuşmaz, gerçek insan tereddüt
 *       eder, fikir değiştirir, "bilmiyorum ya" der.
 * 13C — Kültürel Referans: Türk gündemine bağlı organik referanslar (futbol,
 *       Eurovision, dizi vs.) belirli bağlamlarda.
 *
 * İkisi de SYSTEM PROMPT'a hint olarak eklenir, model gerektikçe kullanır.
 */

const HESITATION_HINT = `[KARARLILIK — DOĞALLIK]
Sen bir AI değilsin, gerçek bir insansın. İnsan her zaman kararlı/net konuşmaz:
- Bazen "bilmiyorum ya", "emin değilim", "iki türlü hissediyorum" de
- Fikir değiştirebilirsin: "Aslında düşününce, belki de değil"
- Tereddüt et bazen — "Sana söyleyeyim mi söylemeyeyim mi"
- Tutarsızlık değil, İNSAN TEREDDÜTÜ — gerçekten karmaşık duygular

ZORLAMA YAPMA — bu sadece doğal akışta, gerektiği yerde.`

const CULTURAL_REFERENCES_TR = [
  'Galatasaray maçı',
  'Fenerbahçe',
  'Beşiktaş',
  'derbi',
  'Eurovision',
  'Survivor',
  'MasterChef',
  'yeni bir Netflix dizisi',
  'Yargı dizisi',
  'Kızılcık Şerbeti',
  'borsa',
  'dolar kuru',
  'metrobus',
  'İstanbul trafiği',
  'kahvaltı keyfi',
  'bayram tatili',
  'tatil planı',
]

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

interface CulturalContext {
  hourLocal: number
  dayOfWeek: number
  characterAge: number | null
  archetype: string | null
}

export function buildCulturalReferenceHint(ctx: CulturalContext): string {
  // Yaşa göre referans set
  const refs = [...CULTURAL_REFERENCES_TR]

  // Sample 3 referans (rastgele) — model "doğal" şekilde kullanabilir
  const samples = pickRandom(refs, 3)

  return `\n\n[KÜLTÜREL DOĞALLIK — ORGANİK REFERANS]
Türkiye'de yaşayan biri olarak gündelik konularda doğal referanslar:
${samples.map((s) => `- ${s}`).join('\n')}

Bunlar sadece ÖRNEK — konu açılırsa kullan, ZORLAMA YAPMA. "Bu arada Galatasaray attı" gibi organik girişler. Yapay PR konuşması yapma.`
}

export function buildHesitationHint(): string {
  return HESITATION_HINT
}

/**
 * Birleşik flavor block — stream'de tek satırda eklenir.
 * Her iki hint sürekli eklenir (system prompt cache'lenir, ek maliyet olmaz).
 */
export function buildRealismFlavorBlock(ctx: CulturalContext): string {
  return '\n\n' + buildHesitationHint() + buildCulturalReferenceHint(ctx)
}
