/**
 * V4.5 Faz 7B — Çoklu Mesaj Bölme
 *
 * Karakterin tek seferde yazdığı uzun cevabı doğal aralıklara böler.
 * 1-4 mesaj, her birinin arasında 2-4 saniye gecikme.
 *
 * Bölme stratejisi:
 *   - Cümle bitişlerinde böl (. ! ? sonrası)
 *   - 4+ cümle varsa son cümleler birleşir
 *   - Tek cümleli cevap → bölme YOK
 *   - Çok kısa parçalar (< 8 char) önceki ile birleşir
 */

const MAX_PARTS = 4
const MIN_PART_LENGTH = 8 // çok kısa fragment yapma

/**
 * Metni cümle bitişlerinden parçalara ayırır.
 * "." "!" "?" karakterleri sonrası boşluk varsa böler.
 * "..." (ellipsis) bölünme noktası DEĞİL.
 */
export function splitIntoMessages(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  // Cümle bitişlerinde böl: "." veya "!" veya "?" sonrası whitespace
  // Ama "..." varsa bölme (ellipsis tek bütün)
  const parts: string[] = []
  let current = ''

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i]
    current += ch

    if (ch === '.' || ch === '!' || ch === '?') {
      // Ellipsis kontrolü: önceki 2 karakter de "." mi?
      if (ch === '.' && trimmed[i - 1] === '.' && trimmed[i - 2] === '.') {
        continue // "..." içinde, böleme
      }
      // Sonraki karakter "." veya "!" veya "?" ise multi-punctuation, devam
      const next = trimmed[i + 1]
      if (next === '.' || next === '!' || next === '?') {
        continue
      }
      // Sonraki karakter whitespace ise burası split point
      if (!next || next === ' ' || next === '\n' || next === '\t') {
        parts.push(current.trim())
        current = ''
        // Whitespace'i atla
        while (i + 1 < trimmed.length && /\s/.test(trimmed[i + 1])) i++
      }
    }
  }
  if (current.trim()) parts.push(current.trim())

  // Çok kısa parçaları öncekiyle birleştir
  const merged: string[] = []
  for (const p of parts) {
    if (p.length < MIN_PART_LENGTH && merged.length > 0) {
      merged[merged.length - 1] += ' ' + p
    } else {
      merged.push(p)
    }
  }

  // Max 4 mesaj — fazlası varsa son parçalar birleşir
  if (merged.length > MAX_PARTS) {
    const head = merged.slice(0, MAX_PARTS - 1)
    const tail = merged.slice(MAX_PARTS - 1).join(' ')
    return [...head, tail]
  }

  return merged
}

/**
 * Her parça için gecikme süresi (ms) — gerçek WhatsApp ritmi.
 * Parça uzunluğuna göre dinamik (uzun cümle = uzun yazma süresi).
 *
 * Yaklaşık 80-120ms/karakter "yazıyor" hissi + 1-2sn arası "düşünme".
 */
export function delaysForParts(parts: string[]): number[] {
  if (parts.length <= 1) return [0]
  const delays: number[] = [0]
  let cumulative = 0
  for (let i = 1; i < parts.length; i++) {
    // Önceki parçanın uzunluğu + biraz düşünme süresi
    const prevLen = parts[i - 1].length
    const typingTime = Math.min(prevLen * 90, 8000) // max 8sn
    const thinkTime = 1200 + Math.floor(Math.random() * 1500) // 1.2-2.7sn düşünme
    cumulative += typingTime + thinkTime
    delays.push(cumulative)
  }
  return delays
}

/**
 * Bir tam cevap için bölünmüş plan üret (parçalar + gecikmeler).
 * `maxParts` ile dışarıdan limit verilebilir (decision motorunun messageCount'una göre).
 *
 * - maxParts=1: tek mesaj zorunlu, hiç bölme
 * - kullanıcı kısa yazdıysa (< 10 kelime) max 1-2 olur
 * - kullanıcı uzun yazdıysa max 3-4'e çıkabilir
 */
export function planMessageDelivery(
  text: string,
  options?: { maxParts?: number; userMessageLength?: number }
): Array<{ content: string; delayMs: number }> {
  let parts = splitIntoMessages(text)
  if (parts.length === 0) return []

  // maxParts limit'i uygula
  const requestedMax = options?.maxParts ?? MAX_PARTS

  // Kullanıcı mesajı kısa ise (< 10 kelime), karakter de kısa kalsın → max 1
  let effectiveMax = requestedMax
  if (options?.userMessageLength !== undefined) {
    const userWordCount = options.userMessageLength
    if (userWordCount < 10) effectiveMax = Math.min(effectiveMax, 1)
    else if (userWordCount < 25) effectiveMax = Math.min(effectiveMax, 2)
    else if (userWordCount < 50) effectiveMax = Math.min(effectiveMax, 3)
    // 50+ kelimede tam limit
  }

  // Parçaları effectiveMax'a sıkıştır (fazlalar son parçaya birleşir)
  if (parts.length > effectiveMax) {
    const head = parts.slice(0, effectiveMax - 1)
    const tail = parts.slice(effectiveMax - 1).join(' ')
    parts = effectiveMax === 1 ? [parts.join(' ')] : [...head, tail]
  }

  const delays = delaysForParts(parts)
  return parts.map((content, i) => ({ content, delayMs: delays[i] }))
}
