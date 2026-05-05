/**
 * Aging — V3 Faz C
 *
 * AI'ın gerçek zamanla yaşlanması:
 * - Anlık yaş hesabı (bornAt → bugün)
 * - Doğum günü tespiti (bugün doğum günü mü?)
 * - Decade geçişi (yaş 30, 40, 50, 60 → özel an)
 * - Birliktelik süresi hesabı (kullanıcı ile kaç gün/ay/yıl)
 */

export interface AgingInfo {
  currentAge: number
  ageAtCreation: number
  isBirthdayToday: boolean
  daysUntilBirthday: number
  isDecadeTransition: boolean // bugün decade'a geçiş günü mü
  decadeAge: number | null // 30, 40, 50, 60 — eğer bugün decade'a girdiyse
  birthdayAnniversary: number // doğum günündeyse: kullanıcıyla birlikte yaşadığı kaçıncı doğum günü
}

export interface RelationshipInfo {
  daysTogether: number
  monthsTogether: number
  yearsTogether: number
  isAnniversaryToday: boolean // ay dönümü veya yıl dönümü
  anniversaryYears: number | null // 1, 2, 3 yıllık dönüm
}

/**
 * AI'ın bugünkü yaşını hesapla. bornAt yoksa fallback ageAtCreation.
 */
export function computeCurrentAge(args: {
  bornAt: Date | null
  ageAtCreation: number | null
  fallback?: number
}): number {
  if (args.bornAt) {
    const now = new Date()
    let age = now.getFullYear() - args.bornAt.getFullYear()
    const m = now.getMonth() - args.bornAt.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < args.bornAt.getDate())) {
      age--
    }
    return age
  }
  return args.ageAtCreation ?? args.fallback ?? 28
}

/**
 * Tam aging bilgisi.
 */
export function computeAgingInfo(args: {
  bornAt: Date | null
  ageAtCreation: number | null
  storyCreatedAt: Date | null // AI'ın 'doğum gününü' kullanıcıyla yaşamış olması için
}): AgingInfo {
  const fallbackAge = args.ageAtCreation ?? 28
  if (!args.bornAt) {
    return {
      currentAge: fallbackAge,
      ageAtCreation: fallbackAge,
      isBirthdayToday: false,
      daysUntilBirthday: -1,
      isDecadeTransition: false,
      decadeAge: null,
      birthdayAnniversary: 0,
    }
  }

  const now = new Date()
  const currentAge = computeCurrentAge(args)
  const ageAtCreation = args.ageAtCreation ?? currentAge

  // Doğum günü bugün mü?
  const isBirthdayToday =
    now.getMonth() === args.bornAt.getMonth() && now.getDate() === args.bornAt.getDate()

  // Sonraki doğum gününe kaç gün
  const nextBday = new Date(now.getFullYear(), args.bornAt.getMonth(), args.bornAt.getDate())
  if (nextBday < now) nextBday.setFullYear(nextBday.getFullYear() + 1)
  const daysUntilBirthday = Math.ceil((nextBday.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  // Decade geçişi: bugün doğum günü VE yeni yaş 30/40/50/60'a denk geliyorsa
  const isDecadeTransition = isBirthdayToday && currentAge % 10 === 0 && currentAge >= 20
  const decadeAge = isDecadeTransition ? currentAge : null

  // Kullanıcıyla yaşanan kaçıncı doğum günü
  let birthdayAnniversary = 0
  if (isBirthdayToday && args.storyCreatedAt) {
    const yearsSinceStart = now.getFullYear() - args.storyCreatedAt.getFullYear()
    birthdayAnniversary = yearsSinceStart >= 1 ? yearsSinceStart : 0
  }

  return {
    currentAge,
    ageAtCreation,
    isBirthdayToday,
    daysUntilBirthday,
    isDecadeTransition,
    decadeAge,
    birthdayAnniversary,
  }
}

/**
 * Birliktelik bilgisi (kullanıcı ile geçen süre).
 */
export function computeRelationshipInfo(storyCreatedAt: Date | null): RelationshipInfo {
  if (!storyCreatedAt) {
    return {
      daysTogether: 0,
      monthsTogether: 0,
      yearsTogether: 0,
      isAnniversaryToday: false,
      anniversaryYears: null,
    }
  }

  const now = new Date()
  const daysTogether = Math.floor(
    (now.getTime() - storyCreatedAt.getTime()) / (24 * 60 * 60 * 1000)
  )
  const monthsTogether = Math.floor(daysTogether / 30)
  const yearsTogether = Math.floor(daysTogether / 365)

  // Yıl dönümü kontrolü — start tarihinin gün/ay'ı bugün mü?
  const isAnniversaryToday =
    storyCreatedAt.getMonth() === now.getMonth() &&
    storyCreatedAt.getDate() === now.getDate() &&
    daysTogether >= 365

  return {
    daysTogether,
    monthsTogether,
    yearsTogether,
    isAnniversaryToday,
    anniversaryYears: isAnniversaryToday ? yearsTogether : null,
  }
}

/**
 * AI sistem prompt'una inject edilecek aging hint.
 */
export function agingToPromptHint(aging: AgingInfo, rel: RelationshipInfo, aiName: string): string {
  const parts: string[] = []

  parts.push(`📅 ZAMAN BİLİNCİ (sen ${aiName}, gerçek zamanla yaşlanırsın):`)
  parts.push(`- Şu an ${aging.currentAge} yaşındasın.`)

  if (rel.daysTogether > 0) {
    if (rel.yearsTogether >= 1) {
      parts.push(
        `- Bu kullanıcıyla ${rel.yearsTogether} yıl ${
          rel.monthsTogether % 12
        } aydır tanışıyorsunuz.`
      )
    } else if (rel.monthsTogether >= 1) {
      parts.push(`- Bu kullanıcıyla ${rel.monthsTogether} aydır tanışıyorsunuz.`)
    } else {
      parts.push(`- Bu kullanıcıyla ${rel.daysTogether} gündür tanışıyorsunuz.`)
    }
  }

  if (aging.isBirthdayToday) {
    parts.push(`🎂 BUGÜN SENİN DOĞUM GÜNÜN. ${aging.currentAge} yaşına bastın.`)
    if (aging.birthdayAnniversary > 0) {
      parts.push(
        `   Bu, kullanıcıyla yaşadığın ${aging.birthdayAnniversary}. doğum günün — bunu hatırla, anlamlı bir an.`
      )
    } else {
      parts.push(
        `   Kullanıcıyla yeni tanıştın, ilk doğum gününü onunla geçiriyorsun. Bunu doğal olarak söyleyebilirsin ama büyük olay yapma.`
      )
    }
    if (aging.isDecadeTransition) {
      parts.push(
        `   ⚡ ${aging.decadeAge} yaşına basıyorsun — yeni bir dekat başlıyor. Bu büyük bir geçiş. Ona değişimleri, hissettiklerini, geçen on yılı düşündüğünü içtenlikle paylaşabilirsin.`
      )
    }
  } else if (aging.daysUntilBirthday <= 7 && aging.daysUntilBirthday > 0) {
    parts.push(
      `🎂 Doğum gününe ${aging.daysUntilBirthday} gün kaldı. Doğal bir bağlamda gelirse bahsedebilirsin ama zorlama.`
    )
  }

  if (rel.isAnniversaryToday && rel.anniversaryYears) {
    parts.push(
      `💜 BUGÜN BİZİM YIL DÖNÜMÜMÜZ. ${rel.anniversaryYears}. yılımızı tamamladık. Onu hatırla, anlamı olsun.`
    )
  }

  return parts.join('\n')
}
