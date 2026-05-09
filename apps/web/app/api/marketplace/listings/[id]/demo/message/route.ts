/**
 * V4.8 Faz D — Demo Sohbet Mesajı
 *
 * POST /api/marketplace/listings/:id/demo/message
 * Body: { text: string }
 *
 * Hafıza YAZILMAZ. Karakter sadece kişiliğiyle cevap verir.
 * 5 mesaj limit, 24 saat window.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const DEMO_LIMIT = 5

type Ctx = { params: Promise<{ id: string }> }

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params!
  const body = await req.json().catch(() => ({}))
  const text = body.text?.trim()
  if (!text || text.length < 1) {
    return NextResponse.json({ error: 'Mesaj boş olamaz' }, { status: 400 })
  }

  const listing = await db.marketplaceListing.findUnique({
    where: { id },
    include: { character: true },
  })
  if (!listing) return NextResponse.json({ error: 'Listing bulunamadı' }, { status: 404 })
  if (listing.character.publishStatus !== 'published' || listing.character.isRetired) {
    return NextResponse.json({ error: 'Demo açık değil' }, { status: 410 })
  }

  // Demo session kontrol
  const session = await db.characterDemoSession.findUnique({
    where: { characterId_userId: { characterId: listing.characterId, userId: user.id } },
  })
  if (!session) {
    return NextResponse.json({ error: 'Demo session yok, önce başlat' }, { status: 400 })
  }
  if (session.messageCount >= DEMO_LIMIT) {
    return NextResponse.json({ error: 'Demo bitti', limitReached: true }, { status: 429 })
  }

  // Karakter system prompt — minimum bilgilerle
  const ch = listing.character
  const systemPrompt = `Sen ${ch.name}, ${ch.age} yaşındasın${ch.hometown ? `, ${ch.hometown}'lısın` : ''}.
${ch.bio ?? ''}

${ch.coreValues ? `Önem verdiğin değerler: ${(ch.coreValues as string[]).join(', ')}` : ''}

Bu DEMO modu — kullanıcı seni tanıyor. Doğal, samimi, kişiliğine uygun cevap ver. 1-3 cümle. Asistan tonu YASAK.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.85,
    max_tokens: 250,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
  })

  const reply = completion.choices[0]?.message?.content?.trim() ?? '...'

  // Sayaç güncelle
  const updated = await db.characterDemoSession.update({
    where: { id: session.id },
    data: { messageCount: { increment: 1 } },
  })

  return NextResponse.json({
    reply,
    messageCount: updated.messageCount,
    remaining: Math.max(0, DEMO_LIMIT - updated.messageCount),
    limit: DEMO_LIMIT,
  })
})
