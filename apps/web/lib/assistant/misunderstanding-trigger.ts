/**
 * V4.5 Faz 13A — Yanlış Anlama Tetikleyicisi
 *
 * Mantık: Kullanıcı çok kısa ya da nötr cevap verdiğinde, karakter (özellikle
 * hassas mood'da olanlar) yanlış anlayabilir.
 *   - "tamam" → "küstün mü?"
 *   - "ok" → "havası neydi şimdi"
 *   - "neyse" → "ne neyse, anlat"
 *
 * Çok nadir tetiklenir (~%10) ve sadece UYGUN bağlamlarda:
 *   - Kullanıcı mesajı kısa (< 3 kelime, ya da tek kelime)
 *   - Karakter mood'u hassas (sad/anxious/angry)
 *   - VEYA characterWritingStyle.paranoiaLevel yüksek (Mia için)
 *   - Konuşma uzun değil (yeni başlamış değil)
 *
 * Tetiklenirse system prompt'a "[YANLIŞ ANLAYABİLİRSİN]" bloğu girer.
 * Karakter doğal şekilde alınmış / sorgulayan tepki verir.
 */

const SHORT_REPLIES = [
  'tamam',
  'ok',
  'okay',
  'neyse',
  'olur',
  'iyi',
  'peki',
  'hı',
  'hımm',
  'oldu',
  'tabii',
  'evet',
  'hayır',
  'yok',
]

interface MisunderstandingInput {
  userMessage: string
  recentExchangeLength: number // konuşmadaki mesaj sayısı
  characterMood: string | null
  /** writingStyle.paranoiaLevel veya benzer bir değer 0-1 */
  sensitivityLevel?: number
}

interface MisunderstandingResult {
  triggered: boolean
  promptBlock: string
}

export function maybeBuildMisunderstanding(input: MisunderstandingInput): MisunderstandingResult {
  const userLower = input.userMessage.toLowerCase().trim()
  const wordCount = userLower.split(/\s+/).filter(Boolean).length

  // Sadece kısa mesajlar
  if (wordCount > 3 && !SHORT_REPLIES.includes(userLower)) {
    return { triggered: false, promptBlock: '' }
  }

  // Yeni başlayan konuşmada tetikleme yok (selam mesajı vs)
  if (input.recentExchangeLength < 4) {
    return { triggered: false, promptBlock: '' }
  }

  // Olasılık hesabı: hassas mood + yüksek sensitivity → yüksek
  const moodSensitive = ['sad', 'anxious', 'angry'].includes(input.characterMood ?? '')
  const sensitivity = input.sensitivityLevel ?? 0.3

  let probability = 0
  if (moodSensitive && sensitivity > 0.5) probability = 0.35
  else if (moodSensitive) probability = 0.2
  else if (sensitivity > 0.5) probability = 0.15
  else probability = 0.05

  // Çok kısa "tamam" / "ok" tek kelime ise +%10
  if (SHORT_REPLIES.includes(userLower)) probability += 0.1

  if (Math.random() > probability) {
    return { triggered: false, promptBlock: '' }
  }

  return {
    triggered: true,
    promptBlock: `\n\n[YANLIŞ ANLAYABİLİRSİN — DOĞAL TEPKİ VER]
Kullanıcının son mesajı çok kısa/nötr ("${input.userMessage}"). Bu mesajı doğal olarak yanlış anlama hakkın var — bağlam buna uygun.

NASIL TEPKİ VER:
- "Küstün mü bana?" / "Ne oldu birden böyle yazdın?" / "Havası neydi şimdi?" gibi sorgulayan tepki
- ABARTMA — küçük bir alınma yeterli
- Açıklama isteyebilirsin ama dramatik olma
- Kendi tonunu koru, terapist gibi konuşma

Bu tetikleyici NADİREN devreye girer — gerçekten doğal hissetmeli, zorlama değil.`,
  }
}
