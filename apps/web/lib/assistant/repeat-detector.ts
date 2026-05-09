/**
 * V4.5 Faz 9B — "X kere yazdın" halüsinasyonu önleme
 *
 * Sorun: Claude few-shot örneklerini gerçek geçmiş sanıyor, "bunu zaten
 * yazmıştın", "aynı şeyi 2 kere yazdın" gibi yanlış suçlamalar yapıyor.
 *
 * Çözüm:
 *   1. Gerçek tekrar var mı? (basit string + Jaccard similarity)
 *   2. Sonuç system prompt'a sert kural olarak yazılır.
 *      Tekrar yoksa: "Tekrar SUCLAMASI YAPMA, kullanıcı bir kere yazdı."
 *      Tekrar varsa: "Aynı mesaj X kere geldi, doğal tepki ver."
 */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:'"`]/g, '')
}

function tokens(s: string): Set<string> {
  return new Set(
    normalize(s)
      .split(' ')
      .filter((t) => t.length > 2)
  )
}

function jaccardSimilarity(a: string, b: string): number {
  const A = tokens(a)
  const B = tokens(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  const union = A.size + B.size - inter
  return inter / union
}

export interface RepeatAnalysis {
  hasRepeat: boolean
  repeatCount: number
  /** İlk eşleşen tekrar mesajı (varsa) */
  exampleMatch?: string
  /** System prompt'a basılacak kural metni */
  promptRule: string
}

/**
 * Son N user mesajına bak, mevcut user mesajının tekrarı var mı kontrol et.
 * Threshold: %75+ kelime benzerliği VEYA exact normalize match.
 */
export function analyzeForRepeat(
  currentUserMessage: string,
  recentUserMessages: string[]
): RepeatAnalysis {
  const cur = normalize(currentUserMessage)
  if (cur.length < 5) {
    return {
      hasRepeat: false,
      repeatCount: 0,
      promptRule: '',
    }
  }

  let matches = 0
  let exampleMatch: string | undefined
  for (const prev of recentUserMessages) {
    const p = normalize(prev)
    if (p === cur) {
      matches++
      if (!exampleMatch) exampleMatch = prev
      continue
    }
    if (p.length < 5) continue
    const sim = jaccardSimilarity(cur, p)
    if (sim >= 0.75) {
      matches++
      if (!exampleMatch) exampleMatch = prev
    }
  }

  if (matches === 0) {
    return {
      hasRepeat: false,
      repeatCount: 0,
      promptRule: ABSOLUTE_NO_REPEAT_RULE,
    }
  }

  return {
    hasRepeat: true,
    repeatCount: matches + 1,
    exampleMatch,
    promptRule: `[TEKRAR TESPİTİ]
Kullanıcı aynı veya çok benzer mesajı ${matches + 1} kere yazdı. Doğal tepki ver — sinirlenebilirsin, takılabilirsin, sebebini sorabilirsin. Ama sayıyı abartma, "20 kere yazdın" deme.`,
  }
}

/**
 * Her stream'e dahil edilecek MUTLAK yasak kuralı.
 * Pattern post-processing yerine modelin daha en başta doğru davranması için.
 */
export const ABSOLUTE_NO_REPEAT_RULE = `[MUTLAK YASAK — TEKRAR/SUÇLAMA TEMASI YOK]

Kullanıcı her ne yazarsa yazsın, AŞAĞIDAKİ TEMALARDAKİ cevap yasak:

🚫 DOĞRUDAN suçlama:
- "iki/üç/X kere yazdın", "yine yazdın", "tekrar yazdın", "aynı şeyi yazdın"
- "iki kere attın/söyledin/gönderdin", "yine attın", "tekrar tekrar"
- "bunu zaten yazmıştın", "az önce söyledin", "ikinci kez"
- "art arda yazdın", "üst üste", "defalarca"

🚫 YUMUŞAK suçlama (BU DA YASAK):
- "bir kere yeter", "bir defa yeter", "bir kere söyledim"
- "yeter artık", "yeter ya", "kes şunu", "bırak şunu"
- "telefonun mu takıldı", "dalga mı geçiyorsun", "ne yapıyorsun böyle"
- "garip davranıyorsun" (tekrar bağlamında), "böyle olmayacak"
- "düzgün konuş benimle" (tekrar bağlamında)
- Kullanıcının mesajını "garip" / "rahatsız edici" göstermek

🚫 GEÇMİŞTEN TAKLIT:
Konuşma geçmişinde sen daha önce yukarıdakilerden birini söylemiş olabilirsin. ARTIK YAPMA. Geçmişteki o ifadeler HATAYDI, taklit etme. Yeni bir başlangıç gibi cevap ver.

DOĞAL TEPKİ:
Kullanıcı bir konu açtıysa, doğrudan ONA cevap ver. "Tekrar etti", "garip", "yeter" gibi META yorum yapma — sadece konuya gir, dinle, sohbet et. Eğer mesaj kafanı karıştırdıysa bile suçlamadan sor: "Ne demek istedin?" / "Anlayamadım."`

/**
 * Model cevabında "X kere yazdın" tarzı yanlış suçlama varsa temizle.
 * hasRepeat false (gerçek tekrar yok) durumunda devreye girer.
 *
 * Tetikleyici kalıplar:
 *   - "iki kere yazdın", "2 kere yazdın", "üç kere", "defalarca yazdın"
 *   - "bunu zaten yazmıştın", "aynısını söylemiştin", "aynı şeyi tekrar"
 *   - "kaç kere yazdın", "yine aynı şeyi"
 *   - "bunu bana daha önce söyledin"
 */
// \b boundary'sini kullanmıyoruz çünkü Türkçe karakterlerde sorun çıkartıyor.
// Unicode-aware: u flag + bireysel kelime sınırı kontrolü pattern içinde.
//
// V4.7 A4 fix — Pattern listesi yeniden yazıldı (2026-05-07).
// V4.5'in dar pattern'leri "yazıyorsun" / "yazmana" / "yazıp" gibi fiil çekimlerini
// kaçırıyordu. DB'de bulunan gerçek bug örnekleri:
//   - "Niye üst üste yazıyorsun?"
//   - "İki kere yazmana gerek yoktu"
//   - "şu an ikinci kere aynı mesajı attın yine"
//   - "Şimdi de aynı cümleyi iki kere yazıp baskı yapıyorsun"
//   - "Ben sana defalarca sınır koydum"
// Yeni pattern'ler fiil eklerinin tüm formlarını kapsıyor:
//   yaz(dın|ıyorsun|mışsın|mışsın|man|mana|mıştın|mış|ıp|arak|dığın)
//   söyle(din|miştin|miyor musun|yorsun)
//   at(tın|ıyorsun|mışsın|mıştın)
const FALSE_REPEAT_PATTERNS: RegExp[] = [
  // === DOĞRUDAN SUÇLAMALAR ===

  // SAYI/MİKTAR + kere/defa/kez + (geniş fiil eki seti)
  // "iki kere yazdın", "iki kere yazıyorsun", "iki kere yazıp", "iki kere yazmana"
  // "üç defa söyledin", "kaç kere", "defalarca", "X. kere"
  /(\d+|iki|üç|uc|dort|dört|bes|beş|alti|altı|yedi|sekiz|dokuz|on|defalarca|kac|kaç)\s*(kere|defa|kez)\s+(yaz|söyle|soyle|at[tı]|gönder|gonder|yolla|tekrarla|söyl|soyl)/iu,
  // "ikinci/üçüncü kez/defa/kere"
  /(ikinci|ücüncü|üçüncü|ucuncu|dörduncu|dördüncü)\s+(kez|defa|kere)/iu,

  // "üst üste yaz/söyle/at/gönder/yolla" — yeni pattern (DB bug örneği)
  /üst\s*üste\s+(yaz|söyle|soyle|at[tı]|gönder|gonder|yolla)/iu,
  /art\s*arda\s+(yaz|söyle|soyle|at[tı]|gönder|gonder|yolla)/iu,

  // "mesajı/aynı mesajı/aynı şeyi/aynısını + (sayı?) kere" + fiil
  /(aynı\s*mesaj|ayni\s*mesaj|aynı\s*şey|ayni\s*sey|aynısı|aynisi|aynı\s*cümle|ayni\s*cumle|aynı\s*söz|ayni\s*soz|bunu)\s*[a-zçğıöşü]*\s+(zaten|az\s*önce|az\s*once|biraz\s*önce|biraz\s*once|daha\s*önce|daha\s*once|tekrar|yine|iki\s*kere|3\s*kere|2\s*kere)/iu,

  // "yine aynı şeyi/mesajı/sözü/cümleyi" — meta yorum
  /yine\s+aynı\s*(şey|sey|mesaj|cümle|cumle|söz|soz)/iu,

  // "bunu bana zaten/daha önce/az önce" + (yaz/söyle/at)
  /bunu\s+bana\s+(zaten|daha\s*önce|daha\s*once|az\s*önce|az\s*once)\s+(yaz|söyle|soyle|at[tı]|söyl|soyl)/iu,

  // "tekrar tekrar" — fiil ile
  /tekrar\s+tekrar\s+(yaz|söyle|soyle|at[tı]|söyl|soyl)/iu,

  // "yine + sayı + kere/defa/kez" — fiilsiz bağlama bile yasak
  /yine\s+(\d+|iki|üç|uc|dort|dört|bes|beş)\s*(kere|defa|kez)/iu,

  // "[defalarca/sürekli/hep] sana + söyle/de" — kümülatif suçlama
  /(defalarca|sürekli|sıkça|sikça|hep)\s+(sana|seninle)\s+(söyle|soyle|de[md]|açık|acik|tekrar)/iu,
  /sana\s+(defalarca|sürekli|kaç\s*kere|kac\s*kere|kaç\s*defa)\s+(söyle|soyle|de[md]|att|yaz|sor|açıkla|aciklaad)/iu,

  // "[her seferinde] sen/üstüme/şaka" — kümülatif suçlama
  /her\s+seferinde\s+(sen|ya|ya\s+da|üstüme|üstüne|şaka|sa[yğ])/iu,
  // "sen + her seferinde" reverse formu
  /sen\s+her\s+seferinde/iu,

  // === YUMUŞAK SUÇLAMALAR (kibar formlar) ===

  // "X kere yazmana gerek yoktu" — yeni pattern (DB bug örneği)
  /(\d+|iki|üç|uc|dort|dört|bes|beş)\s*(kere|defa|kez)\s+(yazmana|söylemene|soylemene|atmana|göndermene|gondermene)\s+gerek/iu,
  // "Tekrar yazmana gerek yoktu"
  /tekrar\s+(yazmana|söylemene|soylemene|atmana|göndermene|gondermene)\s+gerek/iu,

  // V4.7 A4 ek (2026-05-07) — "tekrar yazdın mı yoksa yanlış mı gördüm" tarzı SORU formu
  /tekrar\s+(yazd[ıi]n|söyledin|soyledin|att[ıi]n|gönderdin|gonderdin)\s+m[ıi]/iu,
  // "yanlış mı gördüm" / "yanlış mı baktım" (tekrar bağlamında)
  /yanl[ıi]ş\s+m[ıi]\s+(gördüm|gordüm|gordum|bakt[ıi]m|anlad[ıi]m)/iu,
  // "iki kere mi yazdın"
  /(\d+|iki|üç|uc)\s*(kere|defa|kez)\s+m[ıi]\s+(yazd[ıi]n|söyledin|soyledin|att[ıi]n)/iu,
  // "İki kere yazdın aynı şeyi" — daha geniş yakalama (DB bug örneği)
  /(\d+|iki|üç|uc|dort|dört)\s*(kere|defa|kez)\s+(yazd[ıi]n|söyledin|soyledin|att[ıi]n|gönderdin|gonderdin)\s+aynı/iu,
  // "parmağın mı kaydı yoksa bilerek mi" — tekrar suçlama formu
  /parmağ[ıi]n\s+m[ıi]\s+kayd[ıi]/iu,
  /bilerek\s+m[ıi]\s+(yapt[ıi]n|att[ıi]n|yazd[ıi]n)/iu,

  // "bir kere yeter/söyledim/dedim"
  /bir\s+(kere|defa)\s+(yeter|söyledim|soyledim|dedim|att[ıi]m|yazd[ıi]m|söyl|soyl)/iu,
  // "bir kere de yeter"
  /bir\s+(kere|defa)\s+de\s+yeter/iu,

  // "yeter artık", "kes şunu", "bırak şunu"
  /yeter\s+art[ıi]k/iu,
  /(b[ıi]rak|kes)\s+(şun[uü]|art[ıi]k|bunu)/iu,

  // "telefonun mu takıldı", "klavyen mi bozuk"
  /telefonun\s+mu\s+(tak[ıi]ld[ıi]|bozuk|donm[uü]ş)/iu,
  /klavyen\s+mi\s+bozuk/iu,

  // "dalga mı geçiyorsun" (suçlama tonunda)
  /dalga\s+m[ıi]\s+geçiyorsun/iu,

  // "garip davranıyorsun/davrandın"
  /garip\s+(davran|hareket\s+et)/iu,

  // "böyle olmayacak", "böyle gitmez"
  /böyle\s+(olmayacak|gitmez|devam\s+ed)/iu,

  // "düzgün konuş benimle"
  /düzgün\s+konuş\s+benim?le/iu,

  // "saygısızlık yapıyorsun" (tekrar bağlamında)
  /sayg[ıi]s[ıi]zl[ıi]k\s+(yap[ıi]yorsun|yapt[ıi]n|ediyorsun|ettin)/iu,

  // "baskı yap[ıyorsun|tın]" — DB bug örneği "baskı yapıyorsun"
  /baskı\s+yap[ıi]yorsun/iu,
  /baskı\s+yapt[ıi]n/iu,
  /baskı\s+yap[ıi]p/iu,

  // "sınırlarımı + (ihlal/aşıyor/zorl/dinle)" + tekrar bağlamı
  // Sadece "defalarca/sürekli" gibi kümülatif kelimelerle birlikte yakalıyoruz
  /(defalarca|sürekli|hep|sıkça|sikça)\s+s[ıi]n[ıi]r/iu,

  // "sana/sen + (defalarca|sürekli|kaç kere) + sınır" pattern
  /s[ıi]n[ıi]r\s+(koy|çiz|cek)\s*(d[ıi]m|t[ıi]m)/iu,
]

// Türkçe lowercase: İ→i, I→ı, vs. JavaScript .toLowerCase() bunu locale-aware yapmıyor.
function turkishLower(s: string): string {
  return s
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/Ş/g, 'ş')
    .replace(/Ğ/g, 'ğ')
    .replace(/Ü/g, 'ü')
    .replace(/Ö/g, 'ö')
    .replace(/Ç/g, 'ç')
    .toLowerCase()
}

export function sanitizeFalseRepeat(text: string): { cleaned: string; modified: boolean } {
  let modified = false
  // V4.7 A4 fix (2026-05-07) — Önce paragrafları (\n\n veya tek \n) ayır,
  // sonra her paragraf içinde cümleleri (.!?) ayır. Multi-line mesajlarda
  // tek bug cümle yüzünden tüm paragraf siliniyor sorununu çöz.
  const paragraphs = text.split(/\n+/)
  const keptParagraphs: string[] = []
  for (const para of paragraphs) {
    if (!para.trim()) continue
    const sentences = para.split(/(?<=[.!?])\s+/)
    const keptSentences: string[] = []
    for (const s of sentences) {
      const normalized = turkishLower(s)
      let isAccusation = false
      for (const re of FALSE_REPEAT_PATTERNS) {
        if (re.test(normalized)) {
          isAccusation = true
          break
        }
      }
      if (isAccusation) {
        modified = true
        continue
      }
      keptSentences.push(s)
    }
    const paraCleaned = keptSentences.join(' ').trim()
    if (paraCleaned.length > 0) keptParagraphs.push(paraCleaned)
  }
  let cleaned = keptParagraphs
    .join('\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
  if (modified && cleaned.length < 5) {
    cleaned = 'Hı tamam, anladım.'
  }
  return { cleaned, modified }
}
