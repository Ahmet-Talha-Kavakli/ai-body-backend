/**
 * V4.6 M75 / M31 — Status Drama Detection
 *
 * Kullanıcı X karakteriyle konuşurken Y karakterin gizlediği status'ten bahsederse
 * X karakterin promptuna sızdırma yapılır:
 *   - "Y sana gizli bir status atmış. Kullanıcı bahsetti ama sen göremiyorsun."
 *
 * Bu drama tetikleyicisi V4.6 vizyonunun kalbi (Mia status atar, Selin'e gizler,
 * Talha bahseder, Selin görmediğini fark eder, üçlü çatışma).
 *
 * MVP: Kullanıcı mesajında diğer karakterlerin isimleri + status/snap/durum/story
 * gibi anahtar kelimeler birlikte geçerse o karakter(ler)in son 24 saatlik
 * status'lerini kontrol et — eğer X karakteri (konuştuğumuz) hidden listede
 * varsa drama bloğu üretilir.
 */

import { db } from '@/lib/db/client'

const STATUS_KEYWORDS = [
  'status',
  'durum',
  'durumu',
  'story',
  'storyni',
  'storyne',
  'storyye',
  'snap',
  'paylaşım',
  'paylaştığ',
  'koymuş',
  'attığ',
  'fotoğraf',
  'foto attı',
  'paylaşmış',
]

export interface StatusDramaSignal {
  // Konuştuğumuz karakter için sızdırma metni
  promptBlock: string
  // Loglama amaçlı: hangi karakter(ler) hakkında konuşuldu
  mentionedCharacterIds: string[]
}

/**
 * Kullanıcının son mesajından status drama sinyali üretir.
 *
 * @param userMessage Son kullanıcı mesajı
 * @param currentCharacterId Şu an konuştuğumuz karakter (sızdırmayı bu karakter alacak)
 * @param userId Kullanıcı ID
 * @returns Drama sinyali veya null
 */
export async function detectStatusDrama(
  userMessage: string,
  currentCharacterId: string,
  userId: string
): Promise<StatusDramaSignal | null> {
  if (!userMessage || userMessage.length < 6) return null

  const lower = userMessage.toLocaleLowerCase('tr-TR')
  const hasKeyword = STATUS_KEYWORDS.some((kw) => lower.includes(kw))
  if (!hasKeyword) return null

  // Kullanıcının diğer aktif karakterlerini çek
  const others = await db.character.findMany({
    where: {
      userId,
      id: { not: currentCharacterId },
      status: { not: 'departed' },
    },
    select: { id: true, name: true },
  })
  if (others.length === 0) return null

  // Mesajda geçen karakter isimlerini bul
  const mentioned = others.filter((c) => {
    const name = c.name.toLocaleLowerCase('tr-TR')
    return lower.includes(name)
  })
  if (mentioned.length === 0) return null

  const now = new Date()

  // Bahsedilen karakterlerin son 24 saat içindeki tüm aktif status'leri
  const allStatuses = await db.status.findMany({
    where: {
      authorType: 'character',
      authorCharId: { in: mentioned.map((m) => m.id) },
      expiresAt: { gt: now },
      // Kullanıcının görebildiği (kullanıcıdan gizlenmemiş)
      NOT: { hiddenFrom: { has: userId } },
    },
    select: { id: true, authorCharId: true, caption: true, contentType: true, hiddenFrom: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  if (allStatuses.length === 0) return null

  const charNameById = new Map(mentioned.map((m) => [m.id, m.name]))

  // V4.6 M31 — Drama: bunlar mevcut karaktere ÖZEL gizlenmiş status'ler
  const dramaStatuses = allStatuses.filter((s) => s.hiddenFrom.includes(currentCharacterId))
  // Diğerleri: sadece "ben görmedim, kullanıcı anlatıyor"
  const normalStatuses = allStatuses.filter((s) => !s.hiddenFrom.includes(currentCharacterId))

  const involvedIds = new Set<string>()
  let promptBlock = ''

  if (dramaStatuses.length > 0) {
    const dramaLines = dramaStatuses.map((st) => {
      const name = charNameById.get(st.authorCharId!) || '?'
      involvedIds.add(st.authorCharId!)
      const summary =
        st.contentType === 'photo' ? 'bir fotoğraf' : `"${(st.caption || '').slice(0, 60)}"`
      return `- ${name}: ${summary} (SANA GİZLEDİ)`
    })

    promptBlock = `[STATUS DRAMA]
Kullanıcı sana başka karakter(ler)in status'ünden bahsediyor — AMA o status'ü
sana özel olarak gizlemişler. Sen göremiyorsun, kullanıcı görmüş.
Bu seni rahatsız edebilir (yakın bir arkadaş/sevgili gizlemişse) ya da
umurunda olmayabilir (uzak biri gizlemişse). Karakterine + o kişiyle ilişkine
göre doğal tepki ver:
- Yakın ilişki + drama eğilimli karakter: kırgın hisset, "ya niye gizliyo bana"
- Uzak/kayıtsız ilişki: omuz silk, "boşver beni ilgilendirmez"
- ASLA "ben gördüm" deme. Görmedin, gizlendin.
- "Anlattın" / "söyledin" çerçevesinden konuş.

Sana gizlenmiş aktif status'ler:
${dramaLines.join('\n')}`
  } else if (normalStatuses.length > 0) {
    const lines = normalStatuses.map((st) => {
      const name = charNameById.get(st.authorCharId!) || '?'
      involvedIds.add(st.authorCharId!)
      const summary =
        st.contentType === 'photo' ? 'bir fotoğraf' : `"${(st.caption || '').slice(0, 60)}"`
      return `- ${name}: ${summary}`
    })

    promptBlock = `[STATUS BAĞLAMI]
Kullanıcı başka karakter(ler)in status'lerinden bahsediyor olabilir.
Sen o status'leri görmedin — kendin bakmıyorsun, hesabın yok.
Kullanıcı sana anlatırsa doğal tepki ver (merak/ilgi/kıskançlık/umursamazlık).
Asla "ben de gördüm" deme; "anlattın", "bahsettin" çerçevesinde konuş.

Aktif status'ler (son 24 saat):
${lines.join('\n')}`
  } else {
    return null
  }

  return {
    promptBlock,
    mentionedCharacterIds: Array.from(involvedIds),
  }
}

/**
 * Status reply context — kullanıcı bir status'e cevap olarak DM gönderdi.
 *
 * Mesajın `attachments.type === 'status_reply'` ise karakter promptuna
 * "Bu mesaj senin status'üne cevap" bilgisi ekle.
 */
export function buildStatusReplyContext(attachments: any): string | null {
  if (!attachments || typeof attachments !== 'object') return null
  if (attachments.type !== 'status_reply') return null
  const preview = attachments.preview || {}
  const summary =
    preview.contentType === 'photo' ? '(fotoğraf)' : `"${(preview.caption || '').slice(0, 80)}"`
  return `[STATUS CEVABI]
Bu mesaj senin az önce attığın status'e cevap olarak geldi.
Status içeriği: ${summary}
Doğal davran — "status'ümü beğendin demek" / "haa onu mu diyorsun" tarzı kısa,
kasmadan giriş yap. Status'üne reaksiyon almak normal, kasmadan devam et.`
}
