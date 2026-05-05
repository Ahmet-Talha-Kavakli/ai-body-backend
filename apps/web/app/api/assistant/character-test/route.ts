/**
 * Character Test — V3 Faz C
 *
 * GET  /api/assistant/character-test
 *   { questions: TestQuestion[], completed: boolean, currentArchetype: Archetype }
 *
 * POST /api/assistant/character-test
 *   Body: { answers: { questionId, optionId }[] }
 *   → Skor → archetype + name + character traits update
 *   Response: { archetype, label, blurb, name }
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import {
  ARCHETYPES,
  QUESTIONS,
  scoreTest,
  type Archetype,
  type CharacterTestAnswer,
} from '@/lib/assistant/character-test'
import { generateCharacterStory } from '@/lib/assistant/story-generator'

export const GET = withAuth(async (_req, { user }) => {
  const profile = await db.assistantProfile.findFirst({
    where: { userId: user.id },
    select: {
      archetype: true,
      characterTestCompletedAt: true,
    },
  })

  return NextResponse.json({
    questions: QUESTIONS,
    completed: !!profile?.characterTestCompletedAt,
    currentArchetype: (profile?.archetype as Archetype) ?? 'warm_friend',
  })
})

export const POST = withAuth(async (req, { user }) => {
  let body: { answers?: CharacterTestAnswer[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const answers = body.answers ?? []
  if (!Array.isArray(answers) || answers.length < 3) {
    return NextResponse.json({ error: 'too_few_answers' }, { status: 400 })
  }

  const result = scoreTest(answers)

  // Mevcut profil var mı kontrol — yoksa oluştur
  const existing = await db.assistantProfile.findFirst({
    where: { userId: user.id },
    select: { id: true, name: true },
  })

  // İsim: kullanıcı zaten bir AI ismi belirlediyse (manuel) o korunur,
  // boşsa veya default ise yeni archetype isminden öner
  const keepName = existing?.name && existing.name !== 'Asistan' && existing.name.length > 0
  const finalName = keepName ? existing.name! : result.name

  if (existing) {
    await db.assistantProfile.update({
      where: { id: existing.id },
      data: {
        archetype: result.archetype,
        name: finalName,
        swearProfile: result.spec.swearProfile,
        addressStyle: result.spec.addressStyle,
        verbalTics: result.spec.verbalTics,
        worldview: result.spec.worldview,
        characterTestCompletedAt: new Date(),
      },
    })
  } else {
    await db.assistantProfile.create({
      data: {
        userId: user.id,
        name: finalName,
        archetype: result.archetype,
        swearProfile: result.spec.swearProfile,
        addressStyle: result.spec.addressStyle,
        verbalTics: result.spec.verbalTics,
        worldview: result.spec.worldview,
        characterTestCompletedAt: new Date(),
      },
    })
  }

  // V3 Faz C — Story generation arka planda tetikle
  // User adı + age (HealthProfile'dan)
  const [userInfo, healthProfile] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { name: true } }),
    db.healthProfile.findUnique({ where: { userId: user.id }, select: { age: true } }),
  ])

  // Background — beklemiyoruz, response'u bloklayamayız (10-15 sn sürebilir GPT-4o)
  generateCharacterStory({
    userId: user.id,
    userName: userInfo?.name ?? null,
    userAge: healthProfile?.age ?? null,
    archetype: result.archetype,
    aiName: finalName,
    worldview: result.spec.worldview,
    verbalTics: result.spec.verbalTics,
  }).catch((e) => {
    console.error('[character-test/story-gen]', e)
  })

  return NextResponse.json({
    archetype: result.archetype,
    label: result.spec.label,
    blurb: result.spec.blurb,
    name: finalName,
    nameSuggested: !keepName,
  })
})
