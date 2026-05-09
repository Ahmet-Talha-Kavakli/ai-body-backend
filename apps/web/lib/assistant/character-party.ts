/**
 * V4.6 M14 — Alkol/parti sistemi
 *
 * Cuma/cumartesi gece dışarı çıkma. Kişiliğe göre tolerans.
 * Sarhoşken yazım hatası + duygusal açıklık. Ertesi sabah hangover.
 */

import { db } from '@/lib/db/client'
import { addMoodEvent } from './mood-arc'

export async function loadActivePartyEvent(characterId: string) {
  const now = new Date()
  // Aktif: ya hâlâ partyde ya da hangover sürüyor
  return db.characterPartyEvent.findFirst({
    where: {
      characterId,
      OR: [{ endedAt: null }, { hangoverUntil: { gt: now } }],
    },
    orderBy: { startedAt: 'desc' },
  })
}

export function buildPartyBlock(party: Awaited<ReturnType<typeof loadActivePartyEvent>>): string {
  if (!party) return ''
  const now = Date.now()
  // Hâlâ partyde mi?
  if (!party.endedAt) {
    const drinkLevel = party.drinkLevel
    const withWho = party.withWho ? ` (${party.withWho})` : ''
    let hint = ''
    if (drinkLevel >= 4) {
      hint =
        'ÇOK SARHOŞSUN: yazım hatası yap, daha duygusal/açık ol, harf kayması, "ya..." bolca. Kontrolün biraz gitmiş.'
    } else if (drinkLevel >= 2) {
      hint = 'Hafif çakırkeyifsin: daha rahat, biraz dağınık, samimi.'
    } else {
      hint = 'Daha içmedin/az içtin: normal ama dışarıdasın, ortam gürültülü.'
    }
    return `[GECE DURUMU]\n${party.eventType}${withWho}, drinkLevel ${drinkLevel}/5\n${hint}\n\n`
  }
  // Hangover
  if (party.hangoverUntil && party.hangoverUntil.getTime() > now) {
    return `[HANGOVER]\nDün gece ${party.eventType} → bugün başın ağrıyor, halsizsin. Bazen pişmanlık ("ya o mesajları niye attım"). Az enerji, kısa cevap.\n\n`
  }
  return ''
}

/**
 * Cron — Cuma/cumartesi gece tetik. Karaktere göre tolerans + sıklık.
 */
export async function tickPartyEvents(): Promise<{ started: number; ended: number }> {
  const result = { started: 0, ended: 0 }
  const now = new Date()
  const day = now.getDay() // 0 Sun, 5 Fri, 6 Sat
  const hour = now.getHours()

  // Hangover bitenleri kapat
  const expired = await db.characterPartyEvent.updateMany({
    where: {
      endedAt: null,
      // 6+ saat sonra otomatik kapan
      startedAt: { lt: new Date(now.getTime() - 6 * 3600 * 1000) },
    },
    data: { endedAt: now },
  })
  result.ended = expired.count

  // Cuma/cumartesi gece (21-23 arası) tetiklenir
  const isPartyNight = (day === 5 || day === 6) && hour >= 21 && hour < 23
  if (!isPartyNight) return result

  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      partyFrequency: true,
      alcoholTolerance: true,
      partyEvents: {
        where: { startedAt: { gte: new Date(now.getTime() - 24 * 3600 * 1000) } },
      },
    },
    take: 200,
  })

  for (const c of characters) {
    if (c.partyEvents.length > 0) continue // bugün zaten parti var

    const freqProb: Record<string, number> = {
      never: 0,
      rarely: 0.05,
      sometimes: 0.2,
      often: 0.4,
    }
    const prob = freqProb[c.partyFrequency ?? 'sometimes'] ?? 0.2
    if (Math.random() > prob) continue
    if (c.alcoholTolerance === 'none_religious') continue

    // Drink level kişiliğe göre
    let drinkLevel = 1
    if (c.alcoholTolerance === 'low') drinkLevel = 1 + Math.floor(Math.random() * 2)
    else if (c.alcoholTolerance === 'medium') drinkLevel = 2 + Math.floor(Math.random() * 2)
    else if (c.alcoholTolerance === 'high') drinkLevel = 3 + Math.floor(Math.random() * 3)
    else drinkLevel = 2

    const eventTypes = ['night_out', 'club', 'drinks_with_friends', 'home_drinks']
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const hangoverUntil = new Date(now.getTime() + (6 + drinkLevel * 2) * 3600 * 1000)

    await db.characterPartyEvent.create({
      data: {
        characterId: c.id,
        eventType,
        drinkLevel,
        hangoverUntil,
      },
    })
    // Hangover negatif mood
    if (drinkLevel >= 3) {
      await addMoodEvent({
        characterId: c.id,
        source: 'biological',
        moodImpact: 'negative',
        weight: 3,
        decayDays: 1,
        reason: 'Hangover',
      })
    }
    result.started++
  }
  return result
}
