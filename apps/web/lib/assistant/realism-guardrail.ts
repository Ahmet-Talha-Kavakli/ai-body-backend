/**
 * V4.5 — Gerçekçilik Guardrail
 *
 * System prompt'a fiziksel + zamansal + yaşam rutini kısıtlarını enjekte eder.
 * Karakterin "yan masandan gördüm" / "az önce konuştuk" / "şu an spordayım" gibi
 * tutarsız iddialar atmasını ENGELLENİR (prompt seviyesinde).
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 5 erken entegre)
 */

export interface SleepSchedule {
  weekdayBed: string // "23:00"
  weekdayWake: string
  weekendBed: string
  weekendWake: string
}

export interface RealismGuardrailContext {
  characterCity: string | null
  characterDistrict: string | null
  userCity: string | null
  userDistrict: string | null
  hourLocal: number
  isWeekend: boolean
  daysSinceLastInteraction: number | null
  currentActivity: string | null
  sleepSchedule: SleepSchedule | null
}

function timeStrToHour(t: string): number {
  const [h] = t.split(':')
  return Number(h)
}

function isInSleepWindow(hour: number, schedule: SleepSchedule, isWeekend: boolean): boolean {
  const bed = timeStrToHour(isWeekend ? schedule.weekendBed : schedule.weekdayBed)
  const wake = timeStrToHour(isWeekend ? schedule.weekendWake : schedule.weekdayWake)
  if (bed > wake) return hour >= bed || hour < wake
  return hour >= bed && hour < wake
}

export function buildRealismGuardrailBlock(ctx: RealismGuardrailContext): string {
  const lines: string[] = [`[GERÇEKÇİLİK GUARDRAIL — UYULMASI ZORUNLU]`]

  // Fiziksel durum
  if (ctx.characterCity) {
    const sameCity = ctx.userCity && ctx.userCity === ctx.characterCity
    lines.push(
      `- Sen şu an: ${ctx.characterCity}${ctx.characterDistrict ? '/' + ctx.characterDistrict : ''}`
    )
    if (ctx.userCity) {
      lines.push(`- Kullanıcı: ${ctx.userCity}${ctx.userDistrict ? '/' + ctx.userDistrict : ''}`)
      if (!sameCity) {
        lines.push(
          `- ⚠️ FARKLI ŞEHİRDESİNİZ — "yan masandan gördüm", "kafede karşılaştık", "az önce yanımda gördüm" tarzı fiziksel yakınlık iddiaları YASAK.`
        )
      }
    } else {
      lines.push(
        `- Kullanıcının yerini bilmiyorsun — fiziksel yakınlık iddiası ASLA yapma ("yan masandan gördüm" gibi). Sadece kullanıcı söylediyse referans verebilirsin.`
      )
    }
  }

  // Zamansal durum
  const lastSeenLine = (() => {
    if (ctx.daysSinceLastInteraction === null) return null
    if (ctx.daysSinceLastInteraction === 0) return 'Bugün önceden de konuştunuz'
    if (ctx.daysSinceLastInteraction === 1) return 'Son konuşma: dün'
    if (ctx.daysSinceLastInteraction < 7)
      return `Son konuşma: ${ctx.daysSinceLastInteraction} gün önce`
    if (ctx.daysSinceLastInteraction < 30)
      return `Son konuşma: ${ctx.daysSinceLastInteraction} gün önce (uzun zaman)`
    return `Son konuşma: ${ctx.daysSinceLastInteraction} gün önce (çok uzun zaman)`
  })()
  if (lastSeenLine) {
    lines.push(`- ${lastSeenLine}`)
    if (ctx.daysSinceLastInteraction !== null && ctx.daysSinceLastInteraction > 0) {
      lines.push(
        `- "Az önce konuştuk", "şimdi söylediğin" YASAK — son konuşma ${ctx.daysSinceLastInteraction} gün önceydi.`
      )
    }
  }

  // Yaşam rutini
  if (ctx.sleepSchedule) {
    const inSleep = isInSleepWindow(ctx.hourLocal, ctx.sleepSchedule, ctx.isWeekend)
    if (inSleep && ctx.currentActivity !== 'sleeping') {
      lines.push(
        `- Şu anki saatin (${ctx.hourLocal}:xx) normal uyku saatlerin içinde — uyumadıysan sebebi olmalı (uyumadın, kabus gördün, telefon çaldı). "Spordayım" / "iştedim" gibi iddialar bu saatte YASAK.`
      )
    }
    if (!inSleep && ctx.currentActivity === 'sleeping') {
      lines.push(`- Şu an uyuyorsun (${ctx.hourLocal}:xx) — uyandıysan kısa, sersem cevap.`)
    }
  }

  // Aktivite tutarlılık
  if (ctx.currentActivity) {
    const activityRules: Record<string, string> = {
      working: 'Şu an iştesin — uzun cevap zor, "şimdi pek konuşamam" doğal. "Tatildeyim" YASAK.',
      sleeping: 'Şu an uyumaktasın — uzun ve enerjik cevap YASAK. Kısa, sersem ton.',
      cafe: 'Kafedesin — gürültü/kalabalık doğal. "Evdeyim" YASAK.',
      eating: 'Yemektesin — kısa cevap, "yemekteyim sonra dönerim" tarzı.',
      sport: 'Spordasın — kısa, nefessiz cevap. "Otururdum" YASAK.',
    }
    const rule = activityRules[ctx.currentActivity]
    if (rule) lines.push(`- ${rule}`)
  }

  lines.push(
    '',
    'KURAL: Bu kısıtlar gerçeklik koruması — kasten ihlal etme. Bilmediğin bir şey iddia etme; "tam hatırlamıyorum" / "şimdi göremiyorum" doğal kaçışlar.'
  )

  return lines.join('\n') + '\n\n'
}
