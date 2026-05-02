/**
 * Timezone helper — kullanıcının yerel saatini hesaplar.
 *
 * Server UTC'de çalışıyor (Vercel default). Kullanıcı Türkiye'deyken
 * `new Date().getHours()` 22:00 yerine 19:00 dönüyordu — sabah briefing
 * yanlış saatte tetikleniyor, system prompt'taki "günün hangi vakti" hatalı oluyordu.
 *
 * Bu modül `User.timezone` (örn. "Europe/Istanbul") field'ını okur ve doğru saati verir.
 * Kullanıcı timezone'u yoksa "Europe/Istanbul" varsayılır (FitAI Türkiye odaklı).
 */

const DEFAULT_TIMEZONE = 'Europe/Istanbul'

export function userLocalNow(timezone?: string | null): {
  hour: number
  minute: number
  dayOfWeek: number // 0=Pazar
  dateStr: string // "2026-05-02"
  timeStr: string // "22:30"
  isoLocal: string // "2026-05-02T22:30:00"
} {
  const tz = timezone && timezone.trim() ? timezone : DEFAULT_TIMEZONE
  const now = new Date()

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      weekday: 'short',
    })

    const parts = formatter.formatToParts(now).reduce(
      (acc, p) => {
        acc[p.type] = p.value
        return acc
      },
      {} as Record<string, string>
    )

    const year = parts.year ?? '1970'
    const month = parts.month ?? '01'
    const day = parts.day ?? '01'
    const hour = parseInt(parts.hour ?? '0', 10)
    const minute = parseInt(parts.minute ?? '0', 10)
    const second = parts.second ?? '00'

    // weekday => 0=Sun..6=Sat
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    }
    const dayOfWeek = weekdayMap[parts.weekday ?? 'Mon'] ?? 1

    return {
      hour,
      minute,
      dayOfWeek,
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      isoLocal: `${year}-${month}-${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${second}`,
    }
  } catch {
    // Geçersiz timezone — UTC fallback
    return {
      hour: now.getUTCHours(),
      minute: now.getUTCMinutes(),
      dayOfWeek: now.getUTCDay(),
      dateStr: now.toISOString().slice(0, 10),
      timeStr: now.toISOString().slice(11, 16),
      isoLocal: now.toISOString().slice(0, 19),
    }
  }
}
