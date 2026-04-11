import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { withAiRateLimit } from '@/lib/redis/ratelimit-middleware'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResponse = await withAiRateLimit(userId)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text.slice(0, 4096),
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[Voice/Speak]', error)
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 })
  }
}
