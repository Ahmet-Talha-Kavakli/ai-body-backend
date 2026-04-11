import type { SessionMemoryInput, SessionMemoryTextResult } from './types'

function extractTags(exercises: SessionMemoryInput['exercises'], notes: string | null): string[] {
  const tags: string[] = []

  for (const ex of exercises) {
    const lower = ex.name.toLowerCase()
    if (lower.includes('squat')) tags.push('squat')
    if (lower.includes('deadlift')) tags.push('deadlift')
    if (lower.includes('bench')) tags.push('bench')
    if (lower.includes('press')) tags.push('press')
    if (lower.includes('row')) tags.push('row')
    if (lower.includes('pull')) tags.push('pull')
    if (lower.includes('curl')) tags.push('curl')
    if (lower.includes('lunge')) tags.push('lunge')
    // İlk kelimeyi de ekle (örn. "Barbell" → barbell)
    const firstWord = lower.split(' ')[0]
    if (firstWord && !tags.includes(firstWord)) tags.push(firstWord)
  }

  if (notes) {
    const n = notes.toLowerCase()
    if (n.includes('diz') || n.includes('knee')) tags.push('knee_issue')
    if (n.includes('omuz') || n.includes('shoulder')) tags.push('shoulder_issue')
    if (n.includes('bel') || n.includes('back')) tags.push('back_issue')
    if (n.includes('ağrı') || n.includes('acı') || n.includes('pain')) tags.push('pain_reported')
  }

  return [...new Set(tags)]
}

export function buildSessionMemoryText(input: SessionMemoryInput): SessionMemoryTextResult {
  const { exercises, durationSeconds, overallFormScore, caloriesBurned, notes } = input

  let totalVolume = 0
  const exerciseSummaries: string[] = []

  for (const ex of exercises) {
    let exVolume = 0
    let maxWeight = 0
    let totalReps = 0

    for (const set of ex.sets) {
      const reps = set.reps ?? 0
      const weight = set.weightKg ?? 0
      exVolume += reps * weight
      maxWeight = Math.max(maxWeight, weight)
      totalReps += reps
    }

    totalVolume += exVolume
    const setCount = ex.sets.length
    const avgReps = setCount > 0 ? Math.round(totalReps / setCount) : 0

    const summary =
      maxWeight > 0
        ? `${ex.name}: ${setCount}x${avgReps} @ ${maxWeight}kg (form: ${Math.round(ex.avgFormScore)}/100, hacim: ${exVolume}kg)`
        : `${ex.name}: ${setCount} set, ${totalReps} rep (form: ${Math.round(ex.avgFormScore)}/100)`

    exerciseSummaries.push(summary)
  }

  const durationMin = Math.round(durationSeconds / 60)
  const dateStr = new Date().toLocaleDateString('tr-TR')

  let text = `[Antrenman - ${dateStr}]\n`
  text += `Süre: ${durationMin} dk | Toplam Hacim: ${totalVolume}kg`

  if (overallFormScore !== null) text += ` | Form: ${Math.round(overallFormScore)}/100`
  if (caloriesBurned !== null) text += ` | Kalori: ${Math.round(caloriesBurned)}`

  text += `\nEgzersizler:\n${exerciseSummaries.join('\n')}`
  if (notes) text += `\nNot: ${notes}`

  return { text, tags: extractTags(exercises, notes) }
}
