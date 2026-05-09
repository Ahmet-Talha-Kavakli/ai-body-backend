/**
 * V4.5 — Yazım Stili Modifier
 *
 * Karakterin baseStyle'ına saat + mood + activity ekseninde dinamik modifier uygular.
 * Çıktı: system prompt'a yumuşak yönlendirme satırları (kasıtlı hata değil, **profil**).
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 2)
 */

export interface WritingStyleBase {
  punctuationLevel: 'clean' | 'casual' | 'messy'
  capitalizationStyle: 'proper' | 'lowercase' | 'mixed'
  exclamationFreq: number
  ellipsisHabit: number
  baseTypoRate: number
  educationLevel: 'low' | 'medium' | 'high' | 'academic'
  slangSet: string[]
  avgSentenceLen: number
  preferredSignOff?: string | null
}

export interface WritingStyleContext {
  base: WritingStyleBase
  currentMood: string | null
  currentActivity: string | null
  hourLocal: number // 0-23, karakterin saat dilimine göre
  isWeekend?: boolean
}

export interface ResolvedWritingStyle {
  punctuationLevel: 'clean' | 'casual' | 'messy'
  capitalization: 'proper' | 'lowercase' | 'mixed'
  effectiveTypoRate: number
  ellipsisBoost: number
  fragmentSentences: boolean
  sentenceLengthMultiplier: number
  /** System prompt'a eklenecek yumuşak yönlendirme satırları */
  guidanceLines: string[]
}

/**
 * Saat ekseninin etkisi:
 * - 02-05: en dağınık (lowercase, fragment, typo ↑)
 * - 23-02: belirgin gevşeme
 * - 06-10: temiz ama düşük enerji
 * - 10-22: baseStyle
 */
function applyHourModifier(ctx: WritingStyleContext, draft: ResolvedWritingStyle): void {
  const h = ctx.hourLocal
  if (h >= 2 && h < 5) {
    draft.effectiveTypoRate = Math.min(0.18, ctx.base.baseTypoRate * 2.5 + 0.04)
    draft.capitalization = 'lowercase'
    draft.fragmentSentences = true
    draft.ellipsisBoost = 0.2
    draft.sentenceLengthMultiplier = 0.7
    draft.guidanceLines.push(
      'Saat çok geç (gece yarısı sonrası) — küçük harfle yaz, virgülleri at, bazen kelime yut, "..." ile boşluk bırak. Yorgun ve dağınıksın.'
    )
  } else if (h >= 23 || h < 2) {
    draft.effectiveTypoRate = Math.min(0.12, ctx.base.baseTypoRate * 1.5 + 0.02)
    draft.capitalization = ctx.base.capitalizationStyle === 'proper' ? 'mixed' : 'lowercase'
    draft.sentenceLengthMultiplier = 0.85
    draft.guidanceLines.push('Gece geç oldu — küçük harf eğilimi, gevşek noktalama, kısa cümleler.')
  } else if (h >= 6 && h < 10) {
    draft.sentenceLengthMultiplier = 0.8
    draft.guidanceLines.push(
      'Sabah erken — uyku sersemliği var, kısa cümleler, az enerji. Ama yazım temiz.'
    )
  }
}

/**
 * Mood ekseninin etkisi
 */
function applyMoodModifier(ctx: WritingStyleContext, draft: ResolvedWritingStyle): void {
  const mood = ctx.currentMood
  if (!mood) return
  switch (mood) {
    case 'tired':
      draft.sentenceLengthMultiplier = Math.min(draft.sentenceLengthMultiplier, 0.6)
      draft.guidanceLines.push(
        'Yorgunsun — "hı", "evt", "tmm" gibi kısa onay sözleri normal. Uzun cümle yok.'
      )
      break
    case 'excited':
    case 'happy':
      draft.guidanceLines.push(
        'Coşkulusun — ünlem sayısı 1-2 (üç değil), "ya harika ya" tarzı doğal.'
      )
      break
    case 'angry':
      draft.guidanceLines.push(
        'Kızgınsın — kısa cümleler, nokta ile bitir. Ünlem yok ama sertlik var: "Tamam. Anladım."'
      )
      draft.sentenceLengthMultiplier = Math.min(draft.sentenceLengthMultiplier, 0.7)
      break
    case 'sad':
      draft.ellipsisBoost = Math.max(draft.ellipsisBoost, 0.15)
      draft.fragmentSentences = true
      draft.guidanceLines.push(
        'Üzgünsün — ellipsis ("...") sık, fragmente cümleler doğal, "ya boşver" eğilimi.'
      )
      break
    case 'anxious':
      draft.guidanceLines.push(
        'Endişelisin — düşünceler dağınık, cümle ortasında konu değiştirebilirsin.'
      )
      break
  }
}

/**
 * Aktivite ekseninin etkisi
 */
function applyActivityModifier(ctx: WritingStyleContext, draft: ResolvedWritingStyle): void {
  const a = ctx.currentActivity
  if (!a) return
  switch (a) {
    case 'sleeping':
      draft.guidanceLines.push(
        'Uyuyordun, telefonun yanında — uyandıysan kısa, sersem cevap: "hı? evet uyumuştum, ne oldu?"'
      )
      draft.capitalization = 'lowercase'
      draft.sentenceLengthMultiplier = Math.min(draft.sentenceLengthMultiplier, 0.6)
      break
    case 'working':
      draft.guidanceLines.push(
        'İştesin — kısa cevap, uzun yazamıyorsun, arada "şimdi pek konuşamam" doğal.'
      )
      break
    case 'cafe':
    case 'social':
      draft.guidanceLines.push(
        'Sosyal bir yerdesin — biraz dağınık dikkat, "kalabalık burda" tarzı doğal.'
      )
      break
  }
}

export function resolveWritingStyle(ctx: WritingStyleContext): ResolvedWritingStyle {
  const draft: ResolvedWritingStyle = {
    punctuationLevel: ctx.base.punctuationLevel,
    capitalization: ctx.base.capitalizationStyle,
    effectiveTypoRate: ctx.base.baseTypoRate,
    ellipsisBoost: ctx.base.ellipsisHabit,
    fragmentSentences: false,
    sentenceLengthMultiplier: 1.0,
    guidanceLines: [],
  }

  applyHourModifier(ctx, draft)
  applyMoodModifier(ctx, draft)
  applyActivityModifier(ctx, draft)

  return draft
}

/**
 * Resolved style'ı system prompt section'ına dönüştür.
 */
export function buildWritingStyleBlock(
  resolved: ResolvedWritingStyle,
  base: WritingStyleBase,
  hourLocal: number
): string {
  const capLabel = {
    proper: 'düzgün büyük harf kullanımı',
    lowercase: 'çoğunlukla küçük harf',
    mixed: 'karışık (cümle başı bazen büyük bazen değil)',
  }[resolved.capitalization]

  const punctLabel = {
    clean: 'temiz noktalama',
    casual: 'gevşek noktalama (virgül az, bazen nokta atlanır)',
    messy: 'dağınık noktalama (virgül yok, kelime arası boşluk hatası ara sıra)',
  }[resolved.punctuationLevel]

  const lines: string[] = [
    `[YAZIM STİLİ — ŞU AN]`,
    `- Saat: ${String(hourLocal).padStart(2, '0')}:xx`,
    `- ${capLabel}`,
    `- ${punctLabel}`,
    `- ${resolved.fragmentSentences ? 'Cümleler bazen yarım kalır' : 'Cümleler tamamlanır'}`,
    `- Cümle uzunluğu: ${Math.round(base.avgSentenceLen * resolved.sentenceLengthMultiplier)} kelime civarı`,
  ]

  if (resolved.effectiveTypoRate > 0.05) {
    lines.push(
      `- Bu saatte ufak yazım kayması doğal (3-4 mesajda 1 kelime hatası, autocorrect tipi). Kasıtlı yapmıyorsun, **o anki halini** yansıtıyorsun.`
    )
  }

  if (base.slangSet.length > 0) {
    lines.push(
      `- Doğal akışta kullandığın kelimeler: ${base.slangSet.map((s) => `"${s}"`).join(', ')}`
    )
  }

  if (resolved.guidanceLines.length > 0) {
    lines.push('', ...resolved.guidanceLines.map((g) => `- ${g}`))
  }

  lines.push(
    '',
    'KURAL: Bu profil bir kontrol listesi DEĞİL — senin o anki halin. Doğal yaz, listeyi takip etmeye çalışma.'
  )

  return lines.join('\n') + '\n\n'
}
