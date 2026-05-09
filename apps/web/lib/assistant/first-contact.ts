/**
 * V4.5 — İlk Temas + Sosyal Grafik
 *
 * 1) `validateFirstContact` — yeni karakter ilk mesajındaki fiziksel/sosyal
 *    iddiaları doğrular; tutarsızsa scenario'yu safe fallback'e (random_app /
 *    Jarvis tanıştırması) çevirir.
 * 2) `recordCharacterIntroduction` — CharacterIntroduction tablosuna kayıt yazar.
 * 3) `getKnownPeopleForCharacter` — karakterin "tanıdıkları" listesini döner;
 *    system prompt'un [TANIDIKLARIN] bölümünü besler.
 * 4) `checkCharacterKnowsPerson` — karakter "X'ten duydum" demeden önce sorar.
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 3)
 */

import { db } from '@/lib/db/client'
import type { CharacterTemplate } from './character-templates'

export type FirstContactScenario =
  | 'mutual_friend'
  | 'physical_proximity'
  | 'shared_workplace'
  | 'old_acquaintance'
  | 'random_app'

export type FirstContactPlatform = 'whatsapp' | 'instagram' | 'sms' | 'in_app'

interface ValidateInput {
  userId: string
  templateKey: string
  proposedScenario: FirstContactScenario
  characterPhysicalCity: string | null
}

interface ValidateOutput {
  scenario: FirstContactScenario
  platform: FirstContactPlatform
  viaCharacterId: string | null
  reasonText: string
  physicalProximityCity: string | null
  rewritten: boolean
  rewriteReasons: string[]
}

const SCENARIO_TO_DEFAULT_REASON: Record<FirstContactScenario, string> = {
  mutual_friend: 'Ortak bir arkadaşımız üzerinden tanıştık',
  physical_proximity: 'Aynı yerde karşılaştık',
  shared_workplace: 'İş çevremizden ortak biri üzerinden tanıştık',
  old_acquaintance: 'Geçmişte yollarımız kesişmişti',
  random_app: 'Jarvis aracılığıyla tanıştık',
}

/**
 * İlk temas senaryosunu fiziksel/sosyal gerçeklikle doğrular.
 * Geçmezse Jarvis tanıştırmasına (random_app) düşer — her zaman güvenli.
 */
export async function validateFirstContact(input: ValidateInput): Promise<ValidateOutput> {
  const reasons: string[] = []
  let scenario = input.proposedScenario
  let viaCharacterId: string | null = null
  let physicalProximityCity: string | null = null

  // Kullanıcının fiziksel şehri (varsa)
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { physicalCity: true },
  })
  const userCity = user?.physicalCity ?? null

  // ===== Fiziksel yakınlık iddiası kontrolü =====
  if (scenario === 'physical_proximity') {
    if (!userCity || !input.characterPhysicalCity) {
      reasons.push('Fiziksel şehir bilinmiyor — yakınlık iddiası doğrulanamadı')
      scenario = 'random_app'
    } else if (userCity.toLowerCase() !== input.characterPhysicalCity.toLowerCase()) {
      reasons.push(
        `Karakter ${input.characterPhysicalCity}, kullanıcı ${userCity} — yakınlık imkansız`
      )
      scenario = 'random_app'
    } else {
      physicalProximityCity = input.characterPhysicalCity
    }
  }

  // ===== "X'ten duydum" iddiası kontrolü =====
  // Önkoşul karakter listesi: Selin için Mia kurulu olmalı, Ayşe için Selin, vs.
  const PREREQUISITE_BY_TEMPLATE: Record<string, string> = {
    selin: 'Mia',
    ayse: 'Selin',
  }
  const prereqName = PREREQUISITE_BY_TEMPLATE[input.templateKey]
  if (scenario === 'mutual_friend' && prereqName) {
    const prereqChar = await db.character.findFirst({
      where: { userId: input.userId, name: prereqName, status: { notIn: ['departed', 'broken'] } },
      select: { id: true },
    })
    if (!prereqChar) {
      reasons.push(`${prereqName} kurulmamış — "${prereqName}'den duydum" iddiası geçersiz`)
      scenario = 'random_app'
    } else {
      viaCharacterId = prereqChar.id
    }
  }

  // ===== old_acquaintance kontrolü =====
  // İleride: User profile'da okul/iş bilgisi varsa geçerli, yoksa random_app
  // Şimdilik: kabul ediyoruz — life-engine seed'ten çağrılırsa zaten template'de bu var

  const reasonText = (() => {
    if (scenario === 'mutual_friend' && viaCharacterId && prereqName) {
      return `${prereqName}'den duyduk birbirimizi`
    }
    if (scenario === 'physical_proximity' && physicalProximityCity) {
      return `${physicalProximityCity}'da aynı çevredeyiz`
    }
    if (scenario === 'random_app') {
      return 'Jarvis tanıştırdı — onun eski tanıdığıyım'
    }
    return SCENARIO_TO_DEFAULT_REASON[scenario]
  })()

  // Platform tahmini (template'den çıkar)
  const platform: FirstContactPlatform = 'in_app' // V4'te şimdilik tüm konuşmalar app içinde

  return {
    scenario,
    platform,
    viaCharacterId,
    reasonText,
    physicalProximityCity,
    rewritten: scenario !== input.proposedScenario,
    rewriteReasons: reasons,
  }
}

/**
 * CharacterIntroduction tablosuna kayıt yaz. Spawn sonrası çağrılır.
 */
export async function recordCharacterIntroduction(args: {
  userId: string
  characterId: string
  scenario: FirstContactScenario
  platform: FirstContactPlatform
  viaCharacterId: string | null
  reasonText: string
  physicalProximityCity: string | null
}): Promise<void> {
  try {
    await db.characterIntroduction.create({
      data: {
        userId: args.userId,
        characterId: args.characterId,
        viaCharacterId: args.viaCharacterId,
        reasonText: args.reasonText,
        firstContactScenario: args.scenario,
        firstContactPlatform: args.platform,
        physicalProximityCity: args.physicalProximityCity,
      },
    })
  } catch (err) {
    // Unique constraint — muhtemelen tekrar çağırıldı, sessizce geç
    console.warn('[first-contact] introduction record failed:', err)
  }
}

/**
 * Template'in arrivalScenario field'ından FirstContactScenario'ya çeviri.
 */
export function templateScenarioToValidatable(template: CharacterTemplate): FirstContactScenario {
  const s = template.arrivalScenario
  if (s === 'jarvis_introduced' || s === 'mia_introduced') return 'mutual_friend'
  if (s === 'street_encounter') return 'physical_proximity'
  if (s === 'old_acquaintance') return 'old_acquaintance'
  return 'random_app'
}

// ====================================================================
// SOSYAL GRAFİK — Karakterin "tanıdıkları"
// ====================================================================

export interface KnownPerson {
  name: string
  relation: string
  context: string
  isCharacter: boolean // diğer karakterlerden biri mi (sosyal grafik), yoksa karakterin özel hayatı mı
}

/**
 * Karakter "X'i tanıyor mu?" cevabı için.
 * - Aynı kullanıcının diğer karakterleri arasında ada eşleşen var mı
 * - Bu karakterin CharacterFact'lerinde isim geçiyor mu (anne, kardeş vb.)
 * - CharacterIntroduction zincirinde bağlantı var mı
 */
export async function getKnownPeopleForCharacter(
  characterId: string,
  userId: string
): Promise<KnownPerson[]> {
  const known: KnownPerson[] = []

  // 1) Diğer karakterler (kullanıcının çevresi) — bu karakter onları biliyor mu?
  const intro = await db.characterIntroduction.findUnique({
    where: { characterId },
    select: { viaCharacterId: true },
  })

  const otherCharacters = await db.character.findMany({
    where: {
      userId,
      id: { not: characterId },
      status: { notIn: ['departed', 'broken'] },
    },
    select: { id: true, name: true, archetype: true },
  })

  for (const c of otherCharacters) {
    // viaCharacter ise kesin tanıyor
    if (intro?.viaCharacterId === c.id) {
      known.push({
        name: c.name,
        relation: 'mutual_friend',
        context: `seni tanıştıran ortak arkadaşımız`,
        isCharacter: true,
      })
    }
    // Aynı kullanıcının çevresinde olan ama doğrudan bağ yok — temkinli "duymuş olabilir"
    else {
      known.push({
        name: c.name,
        relation: 'acquaintance_via_user',
        context: `kullanıcı üzerinden adını duydum, henüz tanışmadık`,
        isCharacter: true,
      })
    }
  }

  // 2) CharacterFact'lerden "family" ve "friend" kategorilerinden çıkar
  const facts = await db.characterFact.findMany({
    where: { characterId, superseded: false },
    select: { category: true, fact: true },
  })
  // Sadece bilgi amaçlı — birey adları geçerse prompt'a girer
  for (const f of facts) {
    if (f.category === 'family' || f.category === 'origin' || f.category === 'event') {
      // Kabaca isim ayıklamadan, fact metnini referans olarak veriyoruz (prompt'ta görünür)
      known.push({
        name: f.fact, // fact metni
        relation: f.category,
        context: 'kendi geçmişinden',
        isCharacter: false,
      })
    }
  }

  return known
}

/**
 * System prompt'a [TANIDIKLARIN] bloğu üretir.
 */
export function buildKnownPeopleBlock(known: KnownPerson[]): string {
  if (known.length === 0) return ''

  const characters = known.filter((k) => k.isCharacter)
  const personalFacts = known.filter((k) => !k.isCharacter)

  const lines: string[] = ['[TANIDIKLARIN — UYDURMA YASAK]']

  if (characters.length > 0) {
    lines.push('Kullanıcının çevresindeki kişiler (sosyal grafik):')
    for (const k of characters) {
      const trustLine =
        k.relation === 'mutual_friend'
          ? `${k.name} — ortak arkadaşımız, ondan duyduğunu söyleyebilirsin`
          : `${k.name} — kullanıcı bahsetti, sen henüz tanışmadın (adıyla anabilirsin ama "tanışıyorum" deme)`
      lines.push(`- ${trustLine}`)
    }
  }

  if (personalFacts.length > 0) {
    lines.push('')
    lines.push('Kendi hayatından (CharacterFact üzerinden):')
    for (const k of personalFacts.slice(0, 8)) {
      lines.push(`- ${k.name}`)
    }
  }

  lines.push('')
  lines.push(
    'KURAL: Yukarıdaki listede OLMAYAN bir ismi adıyla anma. "Bir arkadaşım" / "tanıdığım biri" tarzı belirsiz referanslar kabul.'
  )

  return lines.join('\n') + '\n\n'
}
