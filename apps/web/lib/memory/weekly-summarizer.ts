import type { WeeklyMemoryInput } from './types'

export function buildWeeklyMemoryText(input: WeeklyMemoryInput): string {
  const {
    weekStartDate,
    weekEndDate,
    totalWorkouts,
    totalVolume,
    avgFormScore,
    avgReadiness,
    topExercises,
    dailyMetrics,
  } = input

  const startStr = weekStartDate.toLocaleDateString('tr-TR')
  const endStr = weekEndDate.toLocaleDateString('tr-TR')

  const n = dailyMetrics.length

  const avgSleep =
    n > 0 ? Math.round((dailyMetrics.reduce((s, m) => s + m.sleepHours, 0) / n) * 10) / 10 : 0
  const avgStress = n > 0 ? Math.round(dailyMetrics.reduce((s, m) => s + m.stressLevel, 0) / n) : 0
  const avgProtein =
    n > 0 ? Math.round(dailyMetrics.reduce((s, m) => s + m.proteinIntake, 0) / n) : 0
  const avgEnergy =
    n > 0 ? Math.round((dailyMetrics.reduce((s, m) => s + m.energyLevel, 0) / n) * 10) / 10 : 0

  const consistency =
    totalWorkouts >= 5
      ? `${totalWorkouts} antrenman — mükemmel tutarlılık`
      : totalWorkouts === 4
        ? `4 antrenman — güçlü tutarlılık`
        : totalWorkouts === 3
          ? `3 antrenman — iyi`
          : totalWorkouts === 2
            ? `2 antrenman — orta`
            : `1 antrenman — düşük`

  let text = `[Haftalık Özet - ${startStr} / ${endStr}]\n`
  text += `Antrenman: ${consistency} | Toplam Hacim: ${totalVolume}kg\n`
  text += `Form Ort: ${Math.round(avgFormScore)}/100 | Hazırlık Ort: ${Math.round(avgReadiness)}/100\n`
  text += `Ana Egzersizler: ${topExercises.join(', ')}\n`
  text += `Uyku Ort: ${avgSleep}s | Stres Ort: ${avgStress}/10 | Enerji: ${avgEnergy}/10 | Protein: ${avgProtein}g/gün`

  return text
}
