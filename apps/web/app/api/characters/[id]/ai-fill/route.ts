import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { generateFieldAlternatives, type FillField } from '@/lib/marketplace/ai-fill'

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const character = await db.character.findFirst({ where: { id, creatorId: user.id } })
  if (!character) return NextResponse.json({ error: 'Karakter bulunamadı' }, { status: 404 })
  if (character.publishStatus !== 'draft' && character.publishStatus !== 'private') {
    return NextResponse.json(
      { error: 'Yayında olan karakterde AI fill kullanılamaz' },
      { status: 403 }
    )
  }
  const body = await req.json().catch(() => ({}))
  const field = body.field as FillField
  const variantCount = body.variantCount ?? 3
  if (!field) return NextResponse.json({ error: 'field gerekli' }, { status: 400 })

  const existingData: Record<string, any> = {
    name: character.name,
    age: character.age,
    gender: character.gender,
    bio: character.bio,
    hometown: character.hometown,
    archetype: character.archetype,
    category: character.category,
    morningRoutine: character.morningRoutine,
    eveningRoutine: character.eveningRoutine,
    coreValues: character.coreValues,
    pastRelationships: character.pastRelationships,
    npcCircle: character.npcCircle,
    dietaryHabits: character.dietaryHabits,
  }
  const result = await generateFieldAlternatives({ field, existingData, variantCount })
  return NextResponse.json(result)
})
