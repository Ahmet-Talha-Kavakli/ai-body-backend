/**
 * V4.5 Madde 3 — Kullanıcı sesli mesaj transcribe endpoint
 *
 * POST /api/assistant/characters/[characterId]/voice/transcribe
 *   FormData: { audio: File }
 *
 * Yapılan:
 *   1. Audio dosyasını Vercel Blob'a yükle (URL döner)
 *   2. Whisper ile transcribe et (Türkçe) + ton analizi
 *   3. { audioUrl, transcript, durationSec, tone } döndür
 *
 * NOT: Mesaj burada KAYDEDİLMEZ. Mobile transcript'i alıp stream endpoint'ine
 *      `voice` mode flag + audioUrl ile gönderir, orada AssistantMessage'a yazılır.
 *
 * Bu sayede kullanıcı transcript'i görür/düzeltir, sonra gönderir (UX seçimi).
 * V1'de auto-send: mobile transcript geldiği anda stream'i tetikler.
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { withAuth } from '@/lib/api/with-auth'
import { transcribeAudio } from '@/lib/assistant/voice-stt'

type Params = { params: Promise<{ characterId: string }> }

const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10 MB (~5 dk m4a)
const MAX_DURATION_SEC = 180 // 3 dk (kullanıcı uzun sesli yollamasın)

export const POST = withAuth<Params>(async (req, { user, params }) => {
  const { characterId } = await params

  try {
    const formData = await req.formData()
    const file = formData.get('audio') as File | null
    if (!file) {
      return NextResponse.json({ error: 'no_audio' }, { status: 400 })
    }
    if (file.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: 'audio_too_large', limit: MAX_AUDIO_BYTES, actual: file.size },
        { status: 413 }
      )
    }

    // Blob'a yükle
    const ext = (file.name.split('.').pop() ?? 'm4a').toLowerCase()
    const blobKey = `voice/user/${user.id}/${characterId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const uploaded = await put(blobKey, file, {
      access: 'public',
      contentType: file.type || 'audio/m4a',
    })

    // Whisper + ton analizi
    const buffer = Buffer.from(await file.arrayBuffer())
    const stt = await transcribeAudio(buffer, file.name)

    if (stt.durationSec > MAX_DURATION_SEC) {
      return NextResponse.json(
        { error: 'audio_too_long', limit: MAX_DURATION_SEC, actual: stt.durationSec },
        { status: 413 }
      )
    }

    return NextResponse.json({
      audioUrl: uploaded.url,
      transcript: stt.text,
      durationSec: stt.durationSec,
      durationMs: Math.round(stt.durationSec * 1000),
      tone: stt.tone,
    })
  } catch (e) {
    console.error('[voice/transcribe]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'transcribe_failed' },
      { status: 500 }
    )
  }
})
