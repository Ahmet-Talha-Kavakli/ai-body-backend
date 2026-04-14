interface CalcStreakInput {
  currentStreak: number
  longestStreak: number
  lastGoalDate: Date | null
  freezeCharges: number
  freezeUsedDates: string[]
  today: Date
  newStreakAfterGoal?: number
}

interface CalcStreakResult {
  currentStreak: number
  longestStreak: number
  freezeCharges: number
  freezeUsedDates: string[]
  freezeUsed: boolean
  bonusCharge: number
}

export function calcNewStreak(input: CalcStreakInput): CalcStreakResult {
  const {
    currentStreak,
    longestStreak,
    lastGoalDate,
    freezeCharges,
    freezeUsedDates,
    today,
    newStreakAfterGoal,
  } = input

  let bonusCharge = 0
  if (newStreakAfterGoal === 7 || newStreakAfterGoal === 30) {
    bonusCharge = 1
  }

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const lastGoalNorm = lastGoalDate ? new Date(lastGoalDate) : null
  if (lastGoalNorm) lastGoalNorm.setHours(0, 0, 0, 0)

  const metYesterday = lastGoalNorm && lastGoalNorm.toDateString() === yesterday.toDateString()

  if (metYesterday) {
    return {
      currentStreak,
      longestStreak,
      freezeCharges: freezeCharges + bonusCharge,
      freezeUsedDates,
      freezeUsed: false,
      bonusCharge,
    }
  }

  if (freezeCharges > 0) {
    const year = yesterday.getFullYear()
    const month = String(yesterday.getMonth() + 1).padStart(2, '0')
    const date = String(yesterday.getDate()).padStart(2, '0')
    const yesterdayStr = `${year}-${month}-${date}`
    return {
      currentStreak,
      longestStreak,
      freezeCharges: freezeCharges - 1 + bonusCharge,
      freezeUsedDates: [...freezeUsedDates, yesterdayStr],
      freezeUsed: true,
      bonusCharge,
    }
  }

  return {
    currentStreak: 0,
    longestStreak,
    freezeCharges: bonusCharge,
    freezeUsedDates,
    freezeUsed: false,
    bonusCharge,
  }
}
