import { NextRequest, NextResponse } from 'next/server'
import { auth, verifyToken } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { db } from '@/lib/db/client'

export const runtime = 'nodejs'
export const maxDuration = 60

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = await verifyToken(authHeader.slice(7).trim(), {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })
      const u = await db.user.findUnique({
        where: { clerkId: payload.sub ?? '' },
        select: { id: true },
      })
      return u?.id ?? null
    } catch {
      return null
    }
  }
  const { userId: clerkId } = await auth()
  if (!clerkId) return null
  const u = await db.user.findUnique({ where: { clerkId }, select: { id: true } })
  return u?.id ?? null
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { text?: string; voice?: string }
  const text = body.text?.trim()
  if (!text) {
    return NextResponse.json({ error: 'no_text' }, { status: 400 })
  }
  const safeText = text.slice(0, 4000)

  try {
    const openai = new OpenAI()
    const audio = await openai.audio.speech.create({
      model: 'tts-1',
      voice: (body.voice as 'nova' | 'shimmer' | 'alloy' | 'echo' | 'fable' | 'onyx') ?? 'nova',
      input: safeText,
      response_format: 'mp3',
      speed: 1.0,
    })
    const buffer = Buffer.from(await audio.arrayBuffer())
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('[voice/speak]', e)
    return NextResponse.json({ error: 'tts_failed' }, { status: 500 })
  }
}
