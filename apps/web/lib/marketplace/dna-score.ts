/**
 * V4.8 Faz A — DNA Puanı Hesaplayıcı
 *
 * Karakter yaratımı sonu 0-100 puan: bible doluluk + tutarlılık + özgünlük + AI önerisi oranı (negatif).
 * Marketplace ana sayfada listelenmek için min 60. Altında olanlar "muzip/deneysel" kategoriye düşer.
 */

interface DNAInputs {
  // Bible doluluk: zorunlu + opsiyonel alanların doluluk oranı (0-1)
  fillRatio: number
  // Tutarlılık: bible-validation drift skoru (0-100, düşük iyi)
  driftScore: number
  // Özgünlük: AI ile doldurulan alan oranı (0-1, yüksek = az özgün)
  aiFilledRatio: number
  // Yaratıcı kullanıcı puanı (kira sonu rating ortalaması, opsiyonel — yeni karakterde null)
  averageRating?: number | null
}

export interface DNABreakdown {
  total: number
  fillScore: number
  consistencyScore: number
  originalityScore: number
  ratingScore: number
  tier: 'mainstream' | 'experimental'
  warnings: string[]
}

export function calculateDNAScore(inputs: DNAInputs): DNABreakdown {
  // Doluluk skoru (0-30 puan)
  const fillScore = Math.round(Math.min(1, inputs.fillRatio) * 30)

  // Tutarlılık skoru (0-30 puan, drift düşükse yüksek puan)
  const consistencyScore = Math.round(((100 - Math.min(100, inputs.driftScore)) / 100) * 30)

  // Özgünlük skoru (0-25 puan, AI fill düşükse yüksek puan)
  const originalityScore = Math.round((1 - Math.min(1, inputs.aiFilledRatio)) * 25)

  // Rating skoru (0-15 puan, ortalama 4+ ise tam puan)
  let ratingScore = 0
  if (inputs.averageRating == null) {
    ratingScore = 8 // yeni karakter — neutral
  } else {
    ratingScore = Math.round(Math.min(1, Math.max(0, (inputs.averageRating - 1) / 4)) * 15)
  }

  const total = fillScore + consistencyScore + originalityScore + ratingScore

  const warnings: string[] = []
  if (inputs.fillRatio < 0.5) warnings.push('Bible doluluğu düşük')
  if (inputs.driftScore > 50) warnings.push('Bible tutarsızlığı yüksek')
  if (inputs.aiFilledRatio > 0.7) warnings.push('Çoğunluk AI ile dolduruldu — özgünlük düşük')

  const tier: DNABreakdown['tier'] = total >= 60 ? 'mainstream' : 'experimental'

  return {
    total: Math.max(0, Math.min(100, total)),
    fillScore,
    consistencyScore,
    originalityScore,
    ratingScore,
    tier,
    warnings,
  }
}

/**
 * Karakter Json metadata'sından inputs çıkarır.
 * Character.bibleMetadata = { fillRatio, aiFilledFields[], validationResults: { driftScore }, ... }
 */
export function inputsFromBibleMetadata(metadata: any, averageRating?: number | null): DNAInputs {
  return {
    fillRatio: metadata?.fillRatio ?? 0,
    driftScore: metadata?.validationResults?.driftScore ?? 100,
    aiFilledRatio:
      (metadata?.aiFilledFields?.length ?? 0) / Math.max(1, metadata?.totalFields ?? 20),
    averageRating: averageRating ?? null,
  }
}
