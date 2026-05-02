import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { validateAssistantName } from '@/lib/assistant/profanity'

// GET /api/assistant/profile — kullanıcının asistan profili
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const profile = await db.assistantProfile.findUnique({
    where: { userId: user.id },
  })
  return NextResponse.json({ profile })
})

// POST /api/assistant/profile — ilk kurulum (isim ver)
export const POST = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as { name: string }
  const validation = validateAssistantName(body.name ?? '')
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const existing = await db.assistantProfile.findUnique({
    where: { userId: user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'profile_exists' }, { status: 409 })
  }

  const profile = await db.assistantProfile.create({
    data: {
      userId: user.id,
      name: validation.value,
    },
  })

  // V2 (Faz K): otomatik tanışma sohbeti aç + asistan'ın ilk mesajını koy
  const greeting = `Merhaba. Adımı sen verdin — ben ${validation.value}. Önce seni biraz tanımak isterim, kısa tutarız. Hazırsan başlayalım?`

  const conv = await db.assistantConversation.create({
    data: { userId: user.id, title: 'Tanışma' },
  })
  await db.assistantMessage.create({
    data: {
      conversationId: conv.id,
      role: 'assistant',
      content: greeting,
    },
  })

  return NextResponse.json({ ...profile, firstConversationId: conv.id })
})

// PATCH /api/assistant/profile — isim/kişilik güncelle
export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  const body = (await req.json()) as {
    name?: string
    formality?: number
    humor?: number
    directness?: number
    supportStyle?: string
    onboardingStep?: number
    skipOnboarding?: boolean
  }

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) {
    const v = validateAssistantName(body.name)
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 })
    data.name = v.value
  }
  if (body.formality !== undefined) data.formality = Math.max(0, Math.min(1, body.formality))
  if (body.humor !== undefined) data.humor = Math.max(0, Math.min(1, body.humor))
  if (body.directness !== undefined) data.directness = Math.max(0, Math.min(1, body.directness))
  if (body.supportStyle !== undefined) {
    if (!['coaching', 'nurturing', 'informational'].includes(body.supportStyle)) {
      return NextResponse.json({ error: 'invalid_support_style' }, { status: 400 })
    }
    data.supportStyle = body.supportStyle
  }
  if (typeof body.onboardingStep === 'number') {
    data.onboardingStep = Math.max(0, Math.min(6, Math.floor(body.onboardingStep)))
  }
  if (body.skipOnboarding) {
    data.onboardingStep = 6
    data.onboardingCompleted = true
    data.onboardingCompletedAt = new Date()
  }

  const profile = await db.assistantProfile.upsert({
    where: { userId: user.id },
    update: data,
    create: {
      userId: user.id,
      name: (data.name as string) ?? 'Asistan',
      ...data,
    },
  })

  return NextResponse.json(profile)
})
