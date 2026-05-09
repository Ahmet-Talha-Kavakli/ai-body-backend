/**
 * V4.6 M59 — Karakter sohbeti için medya yükleme
 *
 * POST FormData: { file, kind: 'image' | 'video' }
 * Response: { url, type, sizeBytes }
 *
 * Mobile bu endpoint'ten URL alır, sonra stream endpoint'ine
 * `media: { url, type }` parametresiyle gönderir.
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'

const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 40 * 1024 * 1024

function getCharIdFromUrl(url: string): string | null {
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  const idx = segments.indexOf('characters')
  return idx >= 0 ? segments[idx + 1] : null
}

export const POST = withAuth(async (req: NextRequest, { user }) => {
  const characterId = getCharIdFromUrl(req.url)
  if (!characterId) {
    return NextResponse.json({ error: 'character_id_missing' }, { status: 400 })
  }

  // Karakter kullanıcıya ait mi
  const char = await db.character.findFirst({
    where: { id: characterId, userId: user.id },
    select: { id: true },
  })
  if (!char) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const kind = (formData.get('kind') as string | null) ?? 'image'

    if (!file) return NextResponse.json({ error: 'no_file' }, { status: 400 })
    if (kind !== 'image' && kind !== 'video') {
      return NextResponse.json({ error: 'invalid_kind' }, { status: 400 })
    }

    const limit = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES
    if (file.size > limit) {
      return NextResponse.json(
        { error: 'file_too_large', limit, actual: file.size },
        { status: 413 }
      )
    }

    const ext = (file.name.split('.').pop() ?? (kind === 'image' ? 'jpg' : 'mp4')).toLowerCase()
    const blobKey = `chat-media/${user.id}/${characterId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`

    const uploaded = await put(blobKey, file, {
      access: 'public',
      contentType: file.type || (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
    })

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
      type: kind,
      sizeBytes: file.size,
    })
  } catch (e) {
    console.error('[upload-media] fail:', e)
    return NextResponse.json(
      { error: 'upload_failed', message: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    )
  }
})
