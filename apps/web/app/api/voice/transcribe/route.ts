import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const audioBlob = formData.get('audio') as File | null

    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioBlob,
      model: 'whisper-1',
      language: 'tr',
    })

    return NextResponse.json({ transcript: transcription.text })
  } catch (error) {
    console.error('[Voice/Transcribe]', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
