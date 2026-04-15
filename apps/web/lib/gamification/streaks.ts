export interface StreakData {
  current: number
  best: number
  lastActiveDate: string | null
}

export function calculateStreak(activityDates: Date[]): StreakData {
  if (activityDates.length === 0) return { current: 0, best: 0, lastActiveDate: null }

  const sorted = activityDates
    .map((d) => d.toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
    .reverse()

  let current = 0
  let best = 0
  let temp = 1
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  // Bugün veya dün aktif mi?
  if (sorted[0] !== today && sorted[0] !== yesterday) {
    current = 0
  } else {
    current = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = (prev.getTime() - curr.getTime()) / 86400000
      if (diff === 1) {
        current++
        temp++
      } else break
    }
  }

  // Best streak
  temp = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1])
    const curr = new Date(sorted[i])
    const diff = (prev.getTime() - curr.getTime()) / 86400000
    if (diff === 1) temp++
    else temp = 1
    if (temp > best) best = temp
  }
  if (current > best) best = current

  return { current, best, lastActiveDate: sorted[0] }
}
