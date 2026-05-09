import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { runBibleValidation } from '@/lib/marketplace/bible-validation'
import { calculateDNAScore, inputsFromBibleMetadata } from '@/lib/marketplace/dna-score'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({ where: { id, creatorId: user.id } })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })

  const bible = {
    name: character.name,
    age: character.age,
    gender: character.gender,
    bio: character.bio,
    hometown: character.hometown,
    archetype: character.archetype,
    morningRoutine: character.morningRoutine,
    eveningRoutine: character.eveningRoutine,
    coreValues: character.coreValues,
    pastRelationships: character.pastRelationships,
    npcCircle: character.npcCircle,
    dietaryHabits: character.dietaryHabits,
    addictions: character.addictions,
    financialState: character.financialState,
    untoldSecrets: character.untoldSecrets,
  }
  const result = await runBibleValidation(bible as any)
  await db.characterBibleValidation.deleteMany({ where: { characterId: id } })
  await db.characterBibleValidation.create({
    data: {
      characterId: id,
      questions: result.questions as any,
      driftScore: result.driftScore,
      passedAt: result.passed ? new Date() : null,
      failedReason: result.failedReason ?? null,
    },
  })
  const metadata = (character.bibleMetadata as any) ?? {}
  const newMetadata = {
    ...metadata,
    validationResults: {
      driftScore: result.driftScore,
      passed: result.passed,
      validatedAt: new Date().toISOString(),
    },
  }
  const dna = calculateDNAScore(inputsFromBibleMetadata(newMetadata, null))
  await db.character.update({
    where: { id },
    data: { bibleMetadata: newMetadata, dnaScore: dna.total },
  })
  return NextResponse.json({
    driftScore: result.driftScore,
    passed: result.passed,
    failedReason: result.failedReason,
    questions: result.questions,
    dna,
  })
})

export const GET = withAuth<Ctx>(async (_req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({
    where: { id, creatorId: user.id },
    select: { id: true, dnaScore: true, bibleMetadata: true },
  })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  const validation = await db.characterBibleValidation.findUnique({ where: { characterId: id } })
  return NextResponse.json({
    validation,
    dnaScore: character.dnaScore,
    bibleMetadata: character.bibleMetadata,
  })
})
