import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { withAuth } from '@/lib/api/with-auth'

export const runtime = 'nodejs'
export const maxDuration = 60

export const POST = withAuth(async (req: NextRequest) => {
  const form = await req.formData()
  const file = (form as unknown as { get: (k: string) => unknown }).get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }
  try {
    const openai = new OpenAI()
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'tr',
      response_format: 'json',
    })
    return NextResponse.json({ text: transcription.text })
  } catch (e) {
    console.error('[voice/transcribe]', e)
    return NextResponse.json({ error: 'transcription_failed' }, { status: 500 })
  }
})
