interface StreakState {
  currentStreak: number
  longestStreak: number
  lastLogDate: string | null
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

function isYesterday(date: Date, ref: Date): boolean {
  const yesterday = new Date(ref)
  yesterday.setDate(yesterday.getDate() - 1)
  return isSameDay(date, yesterday)
}

export function computeNewStreak(state: StreakState, now: Date): StreakState {
  if (!state.lastLogDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, state.longestStreak),
      lastLogDate: now.toISOString(),
    }
  }
  const last = new Date(state.lastLogDate)
  if (isSameDay(last, now)) return state
  const newCurrent = isYesterday(last, now) ? state.currentStreak + 1 : 1
  const newLongest = Math.max(newCurrent, state.longestStreak)
  return { currentStreak: newCurrent, longestStreak: newLongest, lastLogDate: now.toISOString() }
}
