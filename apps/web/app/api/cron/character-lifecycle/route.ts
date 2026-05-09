/**
 * V4 Faz C — Character Lifecycle Cron
 *
 * Günlük çalışır. 3 iş yapar:
 *   1. Yeni karakter spawn değerlendirmesi (eligible kullanıcılar için)
 *   2. İnaktif ilişkileri cold/silent'a düşür
 *   3. Aktif ilişkilerin accumulationDays'ini +1 artır
 *
 * Sadece v4_characters flag'i AÇIK kullanıcılar için.
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'
import { evaluateAndSpawnNextCharacter } from '@/lib/assistant/character-spawn'
import {
  decayInactiveRelationships,
  incrementAccumulationDays,
} from '@/lib/assistant/character-relationship'
import { decayScoresForInactiveRelationships } from '@/lib/assistant/relationship-decay'
import { tickCharacterGoals } from '@/lib/assistant/character-goals'
import { pruneExpiredMoodEvents } from '@/lib/assistant/mood-arc'
import { tickCharacterThoughts } from '@/lib/assistant/character-thoughts'
import { maybeTriggerLowMoodNoReason } from '@/lib/assistant/character-boundaries'
import { tickBiologicalCycles } from '@/lib/assistant/character-biology'
import { tickPartyEvents } from '@/lib/assistant/character-party'
import { tickDreams } from '@/lib/assistant/character-dreams-v46'
import {
  tickPhoneUnavailability,
  tickWrongRecipientAccident,
  tickAppearanceChanges,
  tickMundaneTroubles,
  tickPreferenceEvolution,
  tickLocationEvents,
} from '@/lib/assistant/character-life-extras'
import { tickImportantDates } from '@/lib/assistant/character-actions-music'
import { runMoodCycleCron } from '@/lib/assistant/character-mood-cycle'
import { maybeGenerateNewStoryline, progressStorylines } from '@/lib/assistant/character-storyline'
import { generateInteractionsForUser } from '@/lib/assistant/inter-character'

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const stats = {
    usersChecked: 0,
    charactersSpawned: 0,
    decayed: 0,
    scoreDecayed: 0,
    accumulated: 0,
    moodUpdated: 0,
    moodSkipped: 0,
    storylinesCreated: 0,
    storylinesResolved: 0,
    storylinesFaded: 0,
    interactionsCreated: 0,
    goalsGenerated: 0,
    goalsProgressed: 0,
    goalsResolved: 0,
    moodEventsPruned: 0,
    thoughtsGenerated: 0,
    lowMoodTriggered: 0,
    reglStarted: 0,
    illnessStarted: 0,
    fatigueStarted: 0,
    partyStarted: 0,
    partyEnded: 0,
    dreamsGenerated: 0,
    phoneUnavailable: 0,
    wrongRecipient: 0,
    appearanceChanges: 0,
    importantDates: 0,
    mundaneTroubles: 0,
    preferencesEvolved: 0,
    locationEvents: 0,
    errors: 0,
  }

  try {
    // 1) Decay + accumulation — global, tüm aktif ilişkiler
    try {
      const d = await decayInactiveRelationships()
      stats.decayed = d.updated
    } catch (e) {
      console.error('[character-lifecycle] decay fail:', e)
      stats.errors++
    }

    try {
      const a = await incrementAccumulationDays()
      stats.accumulated = a.updated
    } catch (e) {
      console.error('[character-lifecycle] accumulation fail:', e)
      stats.errors++
    }

    // V4.6 M8 — 5 eksen skor decay (familiarity/love/momentum/tension)
    try {
      const sd = await decayScoresForInactiveRelationships()
      stats.scoreDecayed = sd.updated
      stats.errors += sd.errors
    } catch (e) {
      console.error('[character-lifecycle] score-decay fail:', e)
      stats.errors++
    }

    // V4.6 M10 — Karakter mikro hedefleri tick
    try {
      const g = await tickCharacterGoals()
      stats.goalsGenerated = g.generated
      stats.goalsProgressed = g.progressed
      stats.goalsResolved = g.resolved
    } catch (e) {
      console.error('[character-lifecycle] goals fail:', e)
      stats.errors++
    }

    // V4.6 M11 — Eski mood event'lerini temizle
    try {
      const m = await pruneExpiredMoodEvents()
      stats.moodEventsPruned = m.deleted
    } catch (e) {
      console.error('[character-lifecycle] mood-prune fail:', e)
      stats.errors++
    }

    // V4.6 M12 — Karakter iç düşünceleri (günde 1 cron, ayrı cron'a taşınabilir)
    try {
      const t = await tickCharacterThoughts()
      stats.thoughtsGenerated = t.generated
    } catch (e) {
      console.error('[character-lifecycle] thoughts fail:', e)
      stats.errors++
    }

    // V4.6 M26 — Sebepsiz moral düşüklüğü tetik
    try {
      const lm = await maybeTriggerLowMoodNoReason()
      stats.lowMoodTriggered = lm.triggered
    } catch (e) {
      console.error('[character-lifecycle] low-mood fail:', e)
      stats.errors++
    }

    // V4.6 M13 — Biyolojik döngüler (regl, hastalık, yorgunluk)
    try {
      const bio = await tickBiologicalCycles()
      stats.reglStarted = bio.reglStarted
      stats.illnessStarted = bio.illnessStarted
      stats.fatigueStarted = bio.fatigueStarted
    } catch (e) {
      console.error('[character-lifecycle] biology fail:', e)
      stats.errors++
    }

    // V4.6 M14 — Parti/alkol event'leri
    try {
      const pty = await tickPartyEvents()
      stats.partyStarted = pty.started
      stats.partyEnded = pty.ended
    } catch (e) {
      console.error('[character-lifecycle] party fail:', e)
      stats.errors++
    }

    // V4.6 M15 — Rüyalar
    try {
      const dr = await tickDreams()
      stats.dreamsGenerated = dr.generated
    } catch (e) {
      console.error('[character-lifecycle] dreams fail:', e)
      stats.errors++
    }

    // V4.6 M37 — Telefon unavailable
    try {
      const ph = await tickPhoneUnavailability()
      stats.phoneUnavailable = ph.triggered
    } catch (e) {
      console.error('[character-lifecycle] phone-unavail fail:', e)
      stats.errors++
    }

    // V4.6 M34 — Yanlış kişiye yazma kazası
    try {
      const wr = await tickWrongRecipientAccident()
      stats.wrongRecipient = wr.triggered
    } catch (e) {
      console.error('[character-lifecycle] wrong-recipient fail:', e)
      stats.errors++
    }

    // V4.6 M48 — Görünüş değişimi
    try {
      const ap = await tickAppearanceChanges()
      stats.appearanceChanges = ap.triggered
    } catch (e) {
      console.error('[character-lifecycle] appearance fail:', e)
      stats.errors++
    }

    // V4.6 M54 — Önemli tarih kontrolü (doğum günü vs)
    try {
      const id = await tickImportantDates()
      stats.importantDates = id.triggered
    } catch (e) {
      console.error('[character-lifecycle] important-dates fail:', e)
      stats.errors++
    }

    // V4.6 M24 — Sıradan sıkıntılar (mundane storyline)
    try {
      const mt = await tickMundaneTroubles()
      stats.mundaneTroubles = mt.created
    } catch (e) {
      console.error('[character-lifecycle] mundane fail:', e)
      stats.errors++
    }

    // V4.6 M25 — Zevk değişimi (preference fact archive)
    try {
      const pe = await tickPreferenceEvolution()
      stats.preferencesEvolved = pe.archived
    } catch (e) {
      console.error('[character-lifecycle] preference fail:', e)
      stats.errors++
    }

    // V4.6 M50 — Konum paylaşımı (storyline location event)
    try {
      const le = await tickLocationEvents()
      stats.locationEvents = le.created
    } catch (e) {
      console.error('[character-lifecycle] location fail:', e)
      stats.errors++
    }

    // V4.5 Faz 10A — Mood döngüsü (6+ saatte bir mood güncelle)
    try {
      const m = await runMoodCycleCron()
      stats.moodUpdated = m.updated
      stats.moodSkipped = m.skipped
    } catch (e) {
      console.error('[character-lifecycle] mood-cycle fail:', e)
      stats.errors++
    }

    // V4.5 Faz 11A — Storyline ilerletme (resolve + fade)
    try {
      const p = await progressStorylines()
      stats.storylinesResolved = p.resolved
      stats.storylinesFaded = p.faded
    } catch (e) {
      console.error('[character-lifecycle] storyline-progress fail:', e)
      stats.errors++
    }

    // V4.5 Faz 12A — Karakter-karakter etkileşim üret (kullanıcı başına 1-2)
    try {
      const usersWithChars = await db.user.findMany({
        where: { characters: { some: { status: 'active' } } },
        select: { id: true },
        take: 100,
      })
      for (const u of usersWithChars) {
        const r = await generateInteractionsForUser({ userId: u.id, maxInteractions: 1 })
        stats.interactionsCreated += r.created
      }
    } catch (e) {
      console.error('[character-lifecycle] inter-character fail:', e)
      stats.errors++
    }

    // V4.5 Faz 11A — Yeni storyline jenerasyonu (aktif karakterler için)
    try {
      const activeChars = await db.character.findMany({
        where: { status: { in: ['active', 'recovering'] } },
        select: {
          id: true,
          userId: true,
          name: true,
          age: true,
          archetype: true,
          lifePhase: true,
          storylines: {
            where: { status: { in: ['active', 'fading'] } },
            select: { title: true },
          },
        },
        take: 100,
      })
      for (const c of activeChars) {
        // Eğer 2+ aktif storyline varsa yeni eklemeyelim (karakter kriz olmasın)
        if (c.storylines.length >= 2) continue
        const created = await maybeGenerateNewStoryline({
          userId: c.userId,
          characterId: c.id,
          context: {
            name: c.name,
            age: c.age ?? null,
            archetype: c.archetype,
            lifePhase: c.lifePhase,
            activeStorylines: c.storylines.map((s) => s.title),
          },
        })
        if (created) stats.storylinesCreated++
      }
    } catch (e) {
      console.error('[character-lifecycle] storyline-generate fail:', e)
      stats.errors++
    }

    // 2) Spawn değerlendirmesi — sadece v4_characters flag'i açık kullanıcılar
    const profiles = await db.assistantProfile.findMany({
      where: { onboardingCompleted: true },
      select: { userId: true },
      take: 500,
    })

    for (const p of profiles) {
      try {
        const enabled = await isFlagEnabled('v4_characters', p.userId)
        if (!enabled) continue
        stats.usersChecked++
        const r = await evaluateAndSpawnNextCharacter(p.userId)
        if (r.spawned) stats.charactersSpawned++
      } catch (e) {
        console.error('[character-lifecycle] spawn fail for user:', p.userId, e)
        stats.errors++
      }
    }

    return NextResponse.json({ ok: true, ...stats })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown', ...stats },
      { status: 500 }
    )
  }
}
