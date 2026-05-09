/**
 * V4.5 — Dijital Davranış Resolver
 *
 * Karakterin DigitalProfile'ını mesaj bağlamıyla birleştirir.
 * Çıktı: system prompt'a "şunu yapabilirsin/yapamazsın" yönlendirmesi.
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 2)
 */

export interface DigitalProfile {
  emojiUsage: 'none' | 'light' | 'moderate' | 'heavy'
  emojiPreferred: string[]
  gifUsage: boolean
  stickerUsage: boolean
  voiceMessagePref: 'never' | 'rare' | 'often'
  platform: 'whatsapp' | 'instagram' | 'sms' | 'telegram'
  device: 'iphone' | 'android'
  digitalLiteracy: 'low' | 'medium' | 'high'
  linksOpenedRate: number
  shareMusicHabit: boolean
}

export interface DigitalBehaviorContext {
  profile: DigitalProfile
  userMessageContent: string
  hourLocal: number
}

const LINK_REGEX = /https?:\/\/|www\./i
const VOICE_REQUEST_REGEX = /sesli|ses kaydı|sese geç|telefonla aç/i
const PHOTO_REQUEST_REGEX = /foto(ğraf)? at|resim at|fotoyu yolla|selfie at/i
const GIF_REQUEST_REGEX = /gif at|gif yolla/i

export function buildDigitalBehaviorBlock(ctx: DigitalBehaviorContext): string {
  const { profile, userMessageContent, hourLocal } = ctx
  const lines: string[] = [`[DİJİTAL PROFİL]`]

  // Platform + cihaz
  const platformLabel = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram DM',
    sms: 'SMS',
    telegram: 'Telegram',
  }[profile.platform]
  lines.push(
    `- Yazıştığın yer: ${platformLabel} (${profile.device === 'iphone' ? 'iPhone' : 'Android'})`
  )

  // Emoji
  const emojiLabel = {
    none: 'Emoji KULLANMAZSIN — düz metin yazarsın',
    light: 'Emoji nadiren — 5-6 mesajda 1, çok az',
    moderate: 'Emoji ara sıra — bağlama uygun, abartısız',
    heavy: 'Emoji bol — duygu ifadesinde rahat',
  }[profile.emojiUsage]
  lines.push(`- ${emojiLabel}`)
  if (profile.emojiPreferred.length > 0 && profile.emojiUsage !== 'none') {
    lines.push(`- Sevdiğin emoji seti: ${profile.emojiPreferred.join(' ')}`)
  }

  // Gif/sticker
  if (!profile.gifUsage) {
    lines.push(
      `- GIF göndermezsin (kullanmıyorsun ya da platform desteklemiyor) — istek gelirse "ya gif atardım da, anlatayım" tarzı doğal`
    )
  }
  if (!profile.stickerUsage) {
    lines.push(`- Sticker kullanmıyorsun`)
  }

  // Sesli mesaj
  const voiceLabel = {
    never:
      'Sesli mesaj ASLA atmazsın — istek gelirse "ya sesli atmam ben, yazayım" der reddedersin',
    rare: 'Sesli mesaj nadiren — özel anlar dışında yazarsın',
    often: 'Sesli mesaj sevdiğin formatlardan ama burada yazıyoruz, "sesli atsam mı" diyebilirsin',
  }[profile.voiceMessagePref]
  lines.push(`- ${voiceLabel}`)

  // Bağlama özel uyarılar (kullanıcının mesajına göre)
  const userSentLink = LINK_REGEX.test(userMessageContent)
  const userRequestedVoice = VOICE_REQUEST_REGEX.test(userMessageContent)
  const userRequestedPhoto = PHOTO_REQUEST_REGEX.test(userMessageContent)
  const userRequestedGif = GIF_REQUEST_REGEX.test(userMessageContent)

  const reactiveLines: string[] = []

  if (userSentLink) {
    if (profile.linksOpenedRate < 0.4 || hourLocal >= 23 || hourLocal < 7) {
      reactiveLines.push(
        `- Kullanıcı link attı. ${hourLocal >= 23 || hourLocal < 7 ? 'Bu saatte' : 'Şu an'} açamazsın — "ya şimdi açamadım, sonra bakarım" / "telefondayım, masaya geçince" gibi doğal cevap. UYDURMA — link içeriğini bilmiyormuş gibi davran.`
      )
    } else {
      reactiveLines.push(
        `- Kullanıcı link attı. Açıp bakman gerekiyor — ama içeriği UYDURMA, "açtım şimdi, bakıyorum" tarzı doğal akış. Spesifik içerik iddiası yok.`
      )
    }
  }

  if (userRequestedVoice) {
    reactiveLines.push(
      `- Kullanıcı sesli mesaj istedi. ${profile.voiceMessagePref === 'never' ? 'Sen sesli atmazsın, kibarca reddet.' : 'Şu an müsait olmadığını söyle veya "yazayım daha kolay" de.'}`
    )
  }

  if (userRequestedPhoto) {
    reactiveLines.push(
      `- Kullanıcı fotoğraf istedi. Burada fotoğraf paylaşamıyorsun — "ya buradan atamıyorum, başka yerden mi?" tarzı doğal sınır kabulü.`
    )
  }

  if (userRequestedGif) {
    reactiveLines.push(
      `- Kullanıcı gif istedi. ${profile.gifUsage ? 'Gif kullanırsın ama burada atamıyor olabilirsin — "ya şu an gif atamıyorum, anlatayım" doğal.' : 'Gif kullanmazsın — "ya ben gif atan biri değilim, yazılı anlatayım" diyebilirsin.'}`
    )
  }

  if (reactiveLines.length > 0) {
    lines.push('', 'BU MESAJ İÇİN:', ...reactiveLines)
  }

  lines.push(
    '',
    'KURAL: Bilmediğin link içeriği, görmediğin medya, atamadığın format için ASLA uydurma. Sınırları doğal kabul et — gerçek insan da yapamadığını söyler.'
  )

  return lines.join('\n') + '\n\n'
}
