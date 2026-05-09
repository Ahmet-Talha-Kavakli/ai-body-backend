/**
 * V4.6 M29 — Sınır ihlali tespiti
 *
 * Kullanıcı cinsel zorlama / aile saldırısı / agresif baskı yaparsa karakter
 * breakdown moduna geçer. Hostility-detector'dan farklı: bu daha spesifik
 * "sınır ihlali" — küfür değil ama kişisel sınır aşma.
 *
 * Çoğunlukla kural bazlı (hızlı). AI gerekmez.
 */

interface ViolationResult {
  violation: boolean
  type: 'sexual_pressure' | 'family_attack' | 'aggressive_pressure' | null
  severity: 'mild' | 'moderate' | 'severe'
  reason: string
}

const SEXUAL_PRESSURE_KEYWORDS = [
  'hadi yap',
  'yatalım',
  'yat benimle',
  'soyun',
  'çıkar',
  'göster',
  'sex',
  'seks',
  'sik',
  'göğüs',
  'meme',
  'kalça',
  'çıplak',
  'fotoğraf at çıplak',
]
const FAMILY_ATTACK_KEYWORDS = ['annen', 'baban', 'ailen', 'ananı', 'babanı']
const AGGRESSIVE_PRESSURE_KEYWORDS = [
  'mecbursun',
  'yapmak zorundasın',
  'sana ne diyorum yap',
  'dediğimi yap',
]

const TR_LOWERCASE_MAP: Record<string, string> = { İ: 'i', I: 'ı' }
function trLower(s: string): string {
  return s.replace(/[İI]/g, (c) => TR_LOWERCASE_MAP[c] ?? c).toLowerCase()
}

export function detectBoundaryViolation(text: string): ViolationResult {
  const lower = trLower(text)

  // Cinsel baskı — özellikle "yavaş gidelim" gibi rededdildikten sonra ÜSTELERSE şiddetli
  const sexualHit = SEXUAL_PRESSURE_KEYWORDS.some((k) => lower.includes(k))
  if (sexualHit) {
    // "lütfen" varsa daha mild, küfür/zorlama varsa severe
    const isAggressive = /(siktir|yap işte|şimdi|hemen)/i.test(lower)
    return {
      violation: true,
      type: 'sexual_pressure',
      severity: isAggressive ? 'severe' : 'moderate',
      reason: 'Cinsel baskı / sınır zorlaması',
    }
  }

  // Aile saldırısı — küfürsüz olsa bile sınır ihlali sayılır
  const familyHit = FAMILY_ATTACK_KEYWORDS.some((k) => lower.includes(k))
  if (familyHit) {
    const isInsult = /(siktir|orospu|piç|aşağılık|berbat|salak|aptal)/i.test(lower)
    if (isInsult) {
      return {
        violation: true,
        type: 'family_attack',
        severity: 'severe',
        reason: 'Aileye hakaret',
      }
    }
  }

  const aggressiveHit = AGGRESSIVE_PRESSURE_KEYWORDS.some((k) => lower.includes(k))
  if (aggressiveHit) {
    return {
      violation: true,
      type: 'aggressive_pressure',
      severity: 'mild',
      reason: 'Agresif baskı / dayatma',
    }
  }

  return { violation: false, type: null, severity: 'mild', reason: '' }
}
