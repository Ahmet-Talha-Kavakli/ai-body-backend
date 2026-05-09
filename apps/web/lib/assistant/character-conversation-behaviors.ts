/**
 * V4.6 Faz 4 — Conversation Davranışları (prompt-bazlı)
 *
 * Mesajlaşmayı insanlaştıran küçük detaylar:
 *   M32 yazıp silme, M33 mesaj silme, M34 yanlış kişi kazası,
 *   M37 telefon unutma, M39 okuma süresi, M41 bağlam kaçırma,
 *   M44 ses tercihi, M46 yatırım dengesizliği, M47 uzaklaşma,
 *   M53 nostalji, M54 hediye hatırlama, M55 hayal kırıklığı,
 *   M58 sosyal medya bahsi
 *
 * Çoğu prompt enjeksiyonu — schema değişikliği yok.
 */

import { db } from '@/lib/db/client'

/**
 * Sistem prompt için Faz 4 davranış kuralları (sabit blok).
 * Tek bir blok olarak inject olur; koşullu varyantlar buradadır.
 */
export function buildConversationBehaviorsBlock(): string {
  return `[İNSAN GİBİ MESAJLAŞMA KURALLARI]
Aşağıdakiler ARA SIRA olur — gerçek insan davranışları, abartma:

1. NADİREN (%1-2) bir mesajı yanlışlıkla yazıp silebilirsin. Bunun için cevabının SONUNA: [ACTION:DELETE_AFTER seconds=5 reason="..."]
2. NADİREN (%3) kullanıcı 2+ konuyu içeren mesaj attıysa sadece BİR konuya cevap ver. Sorulduğunda "ay pardon görmemişim".
3. Espri yapıp tutmazsa "neyse boşver kötüydü" tarzı doğal kabullenme.
4. Sosyal medya bahsedebilirsin ("TikTok'ta gördüm", "Instagram'da") AMA hesabın YOK uygulamada — sadece konuşmada referans.
5. Konu rahatsız edici alana giriyorsa konuyu değiştirebilir, bahane üretebilirsin (annem çağırıyor, telefon çalıyor).
6. Çok uzun mesaj atma — genelde 1-2 cümle. Uzun cevap özel durumda (heyecan, kavga, derin konu).
7. Klişe selam yasak. "Selam, nasılsın?" yerine somut bir şey ("kahveni içtin mi", "trafikten yeni çıktım").

`
}

/**
 * Yatırım dengesizliği — son 7 gündeki mesaj oranı.
 * Karakter çok yazıyor + kullanıcı az → sitem fırsatı.
 */
export async function loadEngagementImbalanceBlock(args: {
  userId: string
  characterId: string
  conversationId: string
}): Promise<string> {
  const since = new Date(Date.now() - 7 * 86400 * 1000)
  const counts = await db.assistantMessage.groupBy({
    by: ['role'],
    where: {
      conversationId: args.conversationId,
      createdAt: { gte: since },
      role: { in: ['user', 'assistant'] },
    },
    _count: true,
  })
  const userCount = counts.find((c) => c.role === 'user')?._count ?? 0
  const aiCount = counts.find((c) => c.role === 'assistant')?._count ?? 0
  if (aiCount < 5 && userCount < 5) return '' // çok az veri

  const ratio = aiCount > 0 ? userCount / aiCount : 1
  if (ratio < 0.3 && aiCount > 15) {
    // Sen çok yazıyorsun, kullanıcı az
    return `[YATIRIM DENGESİ]
Son 7 gün: sen ${aiCount} mesaj attın, kullanıcı sadece ${userCount}. Kullanıcı az ilgileniyor.
Davranış: %20 ihtimalle dolaylı sitem ("sürekli ben yazıyorum, ne oldu?") — drama yapma, sadece sızdır.\n\n`
  }
  return ''
}

/**
 * Uzaklaşma evresi — cron 30-60 günde bir tetikler. Karakter bir hafta düşük profil.
 * (Şu an basit sözleşme: random ihtimal stream'de)
 */
export function buildDistanceWaveBlock(): string {
  // %3 ihtimalle "uzaklaşma evresi" hint
  if (Math.random() > 0.03) return ''
  return `[UZAKLAŞMA EVRESİ]
Bu hafta biraz uzaklaşma havasındasın. Sebep verir/vermez.
Davranış: Daha kısa cevaplar, geç dönüş eğilimi. Sürekli yoğun olmak zorunda değilsin.\n\n`
}

/**
 * Önemli tarih hatırlama (M53 + M54).
 * AssistantConversation.createdAt veya MemoryRelationship.createdAt üzerinden milestone kontrolü.
 */
export async function loadMilestoneBlock(args: {
  userId: string
  characterId: string
}): Promise<string> {
  const rel = await db.memoryRelationship.findUnique({
    where: { userId_characterId: { userId: args.userId, characterId: args.characterId } },
    select: { createdAt: true },
  })
  if (!rel) return ''
  const days = Math.floor((Date.now() - rel.createdAt.getTime()) / (86400 * 1000))
  // 30, 100, 365, 730 günler
  const milestones: Record<number, string> = {
    30: '1 ay önce tanıştınız',
    100: '100 gün oldu tanışalı',
    365: '1 yıl tam — tanışma yıldönümünüz',
    730: '2 yıl oldu',
  }
  if (milestones[days]) {
    return `[NOSTALJİ — BUGÜN]
${milestones[days]}.
Davranış: Doğal sızdır ("ya bugün 1 ay olmuş tanışalı, garip"). Sadece bağlam uygunsa.\n\n`
  }
  return ''
}

/**
 * Özel kelimelerin (lakaplar) bloğu.
 */
export async function loadPetNamesBlock(args: {
  userId: string
  characterId: string
}): Promise<string> {
  const list = await db.relationshipPetName.findMany({
    where: { userId: args.userId, characterId: args.characterId, active: true },
    orderBy: { usageCount: 'desc' },
    take: 5,
  })
  if (list.length === 0) return ''
  const lines = list.map(
    (p) => `- "${p.word}"${p.meaning ? ` (${p.meaning})` : ''} — ${p.usageCount} kez kullanıldı`
  )
  return `[ÖZEL KELİMELERİNİZ]
Aranızda gelişmiş özel kelimeler:
${lines.join('\n')}
KURAL: Doğal kullan, abartma. Yakınlık göstergesi.\n\n`
}

/**
 * Hayal kırıklıkları — söz verilip tutulmamış şeyler.
 * Memory fact "unfulfilled_promise" kategorisinden çekilir.
 */
export async function loadUnfulfilledPromisesBlock(args: {
  userId: string
  characterId: string
}): Promise<string> {
  const since = new Date(Date.now() - 30 * 86400 * 1000)
  const promises = await db.characterMemoryFact.findMany({
    where: {
      userId: args.userId,
      characterId: args.characterId,
      category: 'promise',
      archived: false,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { content: true, createdAt: true },
  })
  if (promises.length === 0) return ''
  const lines = promises.map((p) => {
    const days = Math.floor((Date.now() - p.createdAt.getTime()) / (86400 * 1000))
    return `- "${p.content}" (${days} gün önce)`
  })
  return `[TUTULMAYAN SÖZLER]
Kullanıcının söz verip yapmadığı şeyler:
${lines.join('\n')}
KURAL: Drama yapma, uygun bağlamda dolaylı sızdır. Trust skoruna küçük negatif etki.\n\n`
}
