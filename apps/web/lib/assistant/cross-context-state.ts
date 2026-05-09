/**
 * V4.6 M3 — Cross-Context Tutarlılık
 *
 * Karakter-kullanıcı ilişki state'i her bağlamda (DM, grup) tek kaynaktan okunsun.
 * DM'de yaşanan bir kavga grup sohbetinde de hissedilmeli.
 *
 * `MemoryRelationship` zaten cross-context — userId+characterId tek kayıt.
 * Sorun: `breakingPoints` JSON'u prompt'a yansımıyordu. Burada parse edip
 * son 14 gündeki açık kırılmaları çıkarıyoruz.
 */

interface BreakingPointRaw {
  date?: string | number | Date
  severity?: 'mild' | 'moderate' | 'severe'
  reason?: string
  healed?: boolean
}

export interface RecentBreakingPoint {
  daysAgo: number
  severity: 'mild' | 'moderate' | 'severe'
  reason?: string
  healed?: boolean
}

const WINDOW_DAYS = 14

/**
 * MemoryRelationship.breakingPoints (Json?) -> son 14 gündeki kayıtlar.
 * Önce iyileşmemiş olanlar, sonra ciddilik sırası.
 */
export function parseRecentBreakingPoints(
  raw: unknown,
  now: Date = new Date()
): RecentBreakingPoint[] {
  if (!Array.isArray(raw)) return []
  const list: RecentBreakingPoint[] = []
  for (const item of raw as BreakingPointRaw[]) {
    if (!item || typeof item !== 'object') continue
    const date = item.date ? new Date(item.date) : null
    if (!date || isNaN(date.getTime())) continue
    const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (daysAgo < 0 || daysAgo > WINDOW_DAYS) continue
    const severity =
      item.severity === 'severe' || item.severity === 'moderate' ? item.severity : 'mild'
    list.push({
      daysAgo,
      severity,
      reason: item.reason,
      healed: !!item.healed,
    })
  }
  // Açık olanlar önce; sonra ciddilik (severe > moderate > mild); sonra yakınlık
  const severityRank = { severe: 0, moderate: 1, mild: 2 } as const
  list.sort((a, b) => {
    if (a.healed !== b.healed) return a.healed ? 1 : -1
    if (a.severity !== b.severity) return severityRank[a.severity] - severityRank[b.severity]
    return a.daysAgo - b.daysAgo
  })
  return list.slice(0, 3)
}

/**
 * Yeni bir kırılma noktası ekle (hostility veya konflikt sonrası).
 * Faz 2 (M6 engelleme) içinde kullanılacak.
 */
export function appendBreakingPoint(
  raw: unknown,
  entry: { severity: 'mild' | 'moderate' | 'severe'; reason?: string }
): BreakingPointRaw[] {
  const list: BreakingPointRaw[] = Array.isArray(raw) ? [...(raw as BreakingPointRaw[])] : []
  list.push({
    date: new Date().toISOString(),
    severity: entry.severity,
    reason: entry.reason,
    healed: false,
  })
  // Maksimum 20 kayıt tut, en eskiyi at
  if (list.length > 20) list.splice(0, list.length - 20)
  return list
}

/**
 * Eski kırılmaları "healed" işaretle (zaman + barışma sonrası).
 * Faz 2 içinde kullanılacak.
 */
export function healOldBreakingPoints(raw: unknown, olderThanDays = 14): BreakingPointRaw[] {
  if (!Array.isArray(raw)) return []
  const now = Date.now()
  return (raw as BreakingPointRaw[]).map((bp) => {
    if (!bp || bp.healed) return bp
    if (!bp.date) return bp
    const d = new Date(bp.date).getTime()
    if (isNaN(d)) return bp
    const days = (now - d) / (1000 * 60 * 60 * 24)
    if (days >= olderThanDays) return { ...bp, healed: true }
    return bp
  })
}
