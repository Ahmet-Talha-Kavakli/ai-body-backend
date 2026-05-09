/**
 * V4.6 M13 — Biyolojik Döngü
 *
 * Mia: 28 gün regl döngüsü (3-5 gün agresif/kırılgan).
 * Tüm karakterler: aylık 1 hastalık (2-3 gün), haftalık yorgunluk, açlık.
 *
 * Cron tetikler, mood event olarak yansır.
 */

import { db } from '@/lib/db/client'
import { addMoodEvent } from './mood-arc'

export async function loadActiveBiologicalCycles(characterId: string) {
  const now = new Date()
  return db.characterBiologicalCycle.findMany({
    where: {
      characterId,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      state: { not: 'none' },
    },
    orderBy: { startedAt: 'desc' },
  })
}

export function buildBiologicalBlock(
  cycles: Awaited<ReturnType<typeof loadActiveBiologicalCycles>>
): string {
  if (cycles.length === 0) return ''
  const lines: string[] = []
  for (const c of cycles) {
    if (c.cycleType === 'menstrual' && c.state === 'during') {
      lines.push(`- Regl ${c.intensity}/5 (kırılganlık + agresiflik artar, kısa cevap eğilimi)`)
    } else if (c.cycleType === 'illness') {
      lines.push(`- Hasta (${c.intensity}/5) — yorgun, az enerjili, "iyi değilim"`)
    } else if (c.cycleType === 'fatigue') {
      lines.push(`- Yorgun (${c.intensity}/5) — kısa cevaplar, az emoji`)
    } else if (c.cycleType === 'hunger') {
      lines.push(`- Aç (${c.intensity}/5) — biraz huysuz`)
    } else if (c.cycleType === 'stress') {
      lines.push(`- Stresli (${c.intensity}/5) — dağınık, gergin`)
    }
  }
  if (lines.length === 0) return ''
  return `[BİYOLOJİK DURUM]\n${lines.join('\n')}\n\n`
}

/**
 * Cron — günlük tetik
 */
export async function tickBiologicalCycles(): Promise<{
  reglStarted: number
  illnessStarted: number
  fatigueStarted: number
}> {
  const result = { reglStarted: 0, illnessStarted: 0, fatigueStarted: 0 }
  const now = new Date()

  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      gender: true,
      biologicalCycles: { where: { OR: [{ endsAt: null }, { endsAt: { gt: now } }] } },
    },
    take: 200,
  })

  for (const c of characters) {
    const activeTypes = new Set(c.biologicalCycles.map((b) => b.cycleType))

    // Regl: kadın karakterlerde 28 günde bir, 4 gün
    if (c.gender === 'female' && !activeTypes.has('menstrual')) {
      // Son regl ne zaman? 25-30 gün geçmişse başlat
      const last = await db.characterBiologicalCycle.findFirst({
        where: { characterId: c.id, cycleType: 'menstrual' },
        orderBy: { startedAt: 'desc' },
      })
      const daysSince = last ? (now.getTime() - last.startedAt.getTime()) / (86400 * 1000) : 28
      if (daysSince >= 25 && Math.random() < 0.5) {
        const intensity = 2 + Math.floor(Math.random() * 3) // 2-4
        const endsAt = new Date(now.getTime() + 4 * 86400 * 1000)
        await db.characterBiologicalCycle.create({
          data: {
            characterId: c.id,
            cycleType: 'menstrual',
            state: 'during',
            intensity,
            endsAt,
          },
        })
        await addMoodEvent({
          characterId: c.id,
          source: 'biological',
          moodImpact: 'negative',
          weight: intensity,
          decayDays: 4,
          reason: 'Regl dönemi',
        })
        result.reglStarted++
      }
    }

    // Hastalık: ayda ~1 (her gün %3)
    if (!activeTypes.has('illness') && Math.random() < 0.03) {
      const intensity = 2 + Math.floor(Math.random() * 3)
      const days = 2 + Math.floor(Math.random() * 2) // 2-3 gün
      const endsAt = new Date(now.getTime() + days * 86400 * 1000)
      await db.characterBiologicalCycle.create({
        data: {
          characterId: c.id,
          cycleType: 'illness',
          state: 'during',
          intensity,
          endsAt,
        },
      })
      await addMoodEvent({
        characterId: c.id,
        source: 'biological',
        moodImpact: 'negative',
        weight: intensity + 1,
        decayDays: days,
        reason: 'Hastalandın',
      })
      result.illnessStarted++
    }

    // Yorgunluk: haftada 1-2 (her gün %15)
    if (!activeTypes.has('fatigue') && Math.random() < 0.15) {
      const endsAt = new Date(now.getTime() + 1 * 86400 * 1000)
      await db.characterBiologicalCycle.create({
        data: {
          characterId: c.id,
          cycleType: 'fatigue',
          state: 'during',
          intensity: 2 + Math.floor(Math.random() * 2),
          endsAt,
        },
      })
      result.fatigueStarted++
    }
  }
  return result
}
