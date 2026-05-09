/**
 * V4.6 M7 — İlişki Tipi Sistemi
 *
 * Tek "yakınlık skoru" yerine 12 ilişki tipi. "Sevgili olalım" 1 mesajda
 * olmaz — birikim eşiği ve karakter direnci.
 *
 * Tip değişiklik teklifi:
 *   1. Kullanıcı/karakter teklif eder → pendingTypeChange set
 *   2. Karşı taraf direnç eşiğini hesaplar
 *   3. Yeterli birikim varsa kabul, yoksa "yavaş gidelim" cevap
 */

export type RelationshipType =
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'best_friend'
  | 'dating'
  | 'partner'
  | 'engaged'
  | 'married'
  | 'fuckbuddy'
  | 'ex_partner'
  | 'enemy'
  | 'distant_relative'

export const RELATIONSHIP_TYPE_LABEL: Record<RelationshipType, string> = {
  acquaintance: 'tanıdık',
  friend: 'arkadaş',
  close_friend: 'yakın arkadaş',
  best_friend: 'en yakın arkadaş',
  dating: 'flört ediyor',
  partner: 'sevgili',
  engaged: 'nişanlı',
  married: 'eş',
  fuckbuddy: 'sadece fiziksel',
  ex_partner: 'eski sevgili',
  enemy: 'düşman',
  distant_relative: 'uzak akraba',
}

/**
 * Bir tipten diğerine geçiş için minimum birikim eşikleri.
 * Familiarity ve trust üzerinden değerlendirilir.
 */
const TRANSITION_THRESHOLDS: Partial<
  Record<
    RelationshipType,
    { minFamiliarity: number; minTrust: number; minLove?: number; minDays?: number }
  >
> = {
  acquaintance: { minFamiliarity: 0, minTrust: 0 },
  friend: { minFamiliarity: 20, minTrust: 40 },
  close_friend: { minFamiliarity: 50, minTrust: 60 },
  best_friend: { minFamiliarity: 75, minTrust: 75 },
  dating: { minFamiliarity: 50, minTrust: 60, minLove: 65, minDays: 14 },
  partner: { minFamiliarity: 70, minTrust: 75, minLove: 80, minDays: 60 },
  engaged: { minFamiliarity: 85, minTrust: 85, minLove: 88, minDays: 180 },
  married: { minFamiliarity: 90, minTrust: 90, minLove: 90, minDays: 365 },
  fuckbuddy: { minFamiliarity: 30, minTrust: 30 },
  ex_partner: { minFamiliarity: 0, minTrust: 0 },
  enemy: { minFamiliarity: 0, minTrust: 0 },
  distant_relative: { minFamiliarity: 0, minTrust: 0 },
}

interface ProposalDecisionInput {
  currentType: RelationshipType
  proposedType: RelationshipType
  trust: number
  love: number
  familiarity: number
  daysAccumulated: number
  characterArchetype?: string
}

interface ProposalDecision {
  decision: 'accept' | 'reject' | 'defer'
  reason: string
  /** Sistem prompt'a injecte edilecek davranış ipucu */
  promptHint: string
}

/**
 * Karakter, tip değişiklik teklifine ne tepki verir?
 * Kabul / Red / Erteleme.
 */
export function evaluateTypeProposal(input: ProposalDecisionInput): ProposalDecision {
  const { currentType, proposedType, trust, love, familiarity, daysAccumulated } = input

  // Eğer aynı tip → "zaten bu durumdayız"
  if (currentType === proposedType) {
    return {
      decision: 'reject',
      reason: 'already_same_type',
      promptHint: 'Bu durumdaymışsınız zaten — kibarca hatırlat.',
    }
  }

  // Düşman / ex_partner → engelli reddedilir, kullanıcı çoook çabalar
  if (currentType === 'enemy' && proposedType !== 'acquaintance') {
    return {
      decision: 'reject',
      reason: 'enemy_no_jump',
      promptHint:
        'Sen onu düşman olarak görüyorsun. Aniden başka bir şey olmaz. Sert/soğuk reddet.',
    }
  }

  const target = TRANSITION_THRESHOLDS[proposedType]
  if (!target) {
    return {
      decision: 'reject',
      reason: 'unknown_type',
      promptHint: 'Bu teklif sana yabancı geldi.',
    }
  }

  const trustOk = trust >= target.minTrust
  const loveOk = target.minLove === undefined || love >= target.minLove
  const famOk = familiarity >= target.minFamiliarity
  const daysOk = target.minDays === undefined || daysAccumulated >= target.minDays

  if (trustOk && loveOk && famOk && daysOk) {
    return {
      decision: 'accept',
      reason: 'thresholds_met',
      promptHint: `Birikim yeterli — kabul edebilirsin. Aşırı çoşkulu DEĞİL, doğal/sıcak bir kabul.`,
    }
  }

  // Hangisi eksik?
  const missing: string[] = []
  if (!trustOk) missing.push(`güven (${trust}/${target.minTrust})`)
  if (!loveOk) missing.push(`sevgi (${love}/${target.minLove})`)
  if (!famOk) missing.push(`tanışıklık (${familiarity}/${target.minFamiliarity})`)
  if (!daysOk) missing.push(`süre (${daysAccumulated}/${target.minDays} gün)`)

  // Eksik miktarına göre defer (yavaş yavaş) ya da reject (henüz erken)
  const trustGap = target.minTrust - trust
  const loveGap = (target.minLove ?? 0) - love
  const totalGap = Math.max(trustGap, loveGap)

  if (totalGap > 30) {
    return {
      decision: 'reject',
      reason: 'too_early',
      promptHint: `Bu teklif sana erken geldi. Eksik: ${missing.join(', ')}. "Henüz olmaz", "tanışmıyoruz daha" tarzı yumuşak red.`,
    }
  }
  return {
    decision: 'defer',
    reason: 'needs_time',
    promptHint: `Teklif kabul edilebilir ama biraz daha zaman gerekiyor. Eksik: ${missing.join(', ')}. "Yavaş gidelim", "henüz biraz erken ama göreceğiz" tarzı erteleme.`,
  }
}

/**
 * Sistem prompt için ilişki tipi block'u.
 */
export function buildRelationshipTypeBlock(args: {
  currentType: RelationshipType
  intensity: number
  pending: { proposedType?: string; proposedAt?: string; status?: string } | null
  trust: number
  love: number
  familiarity: number
  daysAccumulated: number
}): string {
  const label = RELATIONSHIP_TYPE_LABEL[args.currentType] ?? args.currentType
  let block = `[İLİŞKİ TİPİ]
Şu an: ${label} (yoğunluk ${args.intensity}/100)`

  if (args.pending?.proposedType && args.pending?.status === 'pending') {
    const proposedLabel =
      RELATIONSHIP_TYPE_LABEL[args.pending.proposedType as RelationshipType] ??
      args.pending.proposedType
    const decision = evaluateTypeProposal({
      currentType: args.currentType,
      proposedType: args.pending.proposedType as RelationshipType,
      trust: args.trust,
      love: args.love,
      familiarity: args.familiarity,
      daysAccumulated: args.daysAccumulated,
    })
    block += `\nBekleyen teklif: ${proposedLabel} olma teklifi var.\nKararın: ${decision.decision.toUpperCase()} — ${decision.promptHint}`
  } else {
    block += `\nKURAL: Kullanıcı bu konuşmada ilişki tipini değiştirmek istiyorsa (örn. "sevgili olalım", "evlenelim"), 1 mesajda kabul ETME — birikim ve karakter kişiliğine göre direnç göster.`
  }

  return block + '\n'
}
