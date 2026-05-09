/**
 * V4.7 B7 — Signature Phrase Rotator (haftada 1, sonuç olarak ~30-45 günde rotation)
 *
 * Her aktif karakter için:
 *   - retiredAt=null + isPermanent=false ifadelerden 1 tanesi %30 ihtimalle:
 *       retire (retiredAt=now, retiredReason='rotation')
 *       gpt-4o-mini ile yeni ifade üret (mood + storyline kaynaklı)
 *
 * Kalıcı imzalar (isPermanent=true) hiç dokunulmaz.
 *
 * Lokal: curl http://localhost:3000/api/cron/signature-phrase-rotator
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import OpenAI from 'openai'

export const maxDuration = 180

async function generateNewPhrase(args: {
  characterName: string
  mood: string | null
  category: string
  retiredPhrase: string
}): Promise<string | null> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bir Türk karakter (${args.characterName}) için yeni bir konuşma imzası üretiyorsun.

Mood: ${args.mood ?? 'normal'}
Kategori: ${args.category} (opener=girizgah / closer=kapanış / filler=geçiş / reaction=tepki)
Eski emekli: "${args.retiredPhrase}"

Yeni ifade:
- Doğal Türkçe konuşma kalıbı (argo, gündelik). 1-5 kelime.
- ASLA klişe ("merhaba", "nasılsın").
- ASLA Replika tonu.
- Eski ifadeyle aynı OLMAMALI ama benzer kategoride.

Sadece ifadeyi yaz, başka açıklama yok. Tırnak yok.`,
        },
        { role: 'user', content: 'Yeni imza ifade üret.' },
      ],
      temperature: 1.0,
      max_tokens: 30,
    })
    const text = r.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '')
    if (!text || text.length < 2 || text.length > 60) return null
    return text
  } catch (e) {
    console.error('[signature-phrase-rotator] AI fail:', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const characters = await db.character.findMany({
    where: { status: 'active' },
    select: { id: true, name: true, currentMood: true },
  })

  let processed = 0
  let rotated = 0

  for (const char of characters) {
    processed++

    if (Math.random() > 0.3) continue

    const fluid = await db.characterSignaturePhrase.findMany({
      where: { characterId: char.id, retiredAt: null, isPermanent: false },
    })
    if (fluid.length === 0) continue

    const target = fluid[Math.floor(Math.random() * fluid.length)]
    const newPhrase = await generateNewPhrase({
      characterName: char.name,
      mood: char.currentMood,
      category: target.category,
      retiredPhrase: target.phrase,
    })
    if (!newPhrase) continue

    await db.characterSignaturePhrase.update({
      where: { id: target.id },
      data: { retiredAt: new Date(), retiredReason: 'rotation' },
    })
    await db.characterSignaturePhrase.create({
      data: {
        characterId: char.id,
        phrase: newPhrase,
        category: target.category,
        isPermanent: false,
      },
    })
    rotated++
  }

  return NextResponse.json({
    ok: true,
    processed,
    rotated,
    timestamp: new Date().toISOString(),
  })
}
