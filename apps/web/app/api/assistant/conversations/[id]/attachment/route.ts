/**
 * Mesaj Eki Yükleme — V3 Faz B
 *
 * POST /api/assistant/conversations/[id]/attachment
 *   FormData: { file, kind: 'image' | 'video' | 'document' }
 *
 * Dosyayı Vercel Blob'a yükler, AssistantMessage'a 'attachments' field'ında saklar.
 * Image/document için AI vision/text analizini de tetikler (background).
 *
 * Response: { messageId, attachment: { url, kind, ... } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { embedAndStoreMessage } from '@/lib/assistant/rag'

type Params = { params: Promise<{ id: string }> }

const MAX_IMAGE_BYTES = 8 * 1024 * 1024 // 8 MB
const MAX_VIDEO_BYTES = 40 * 1024 * 1024 // 40 MB (30 sn video)
const MAX_DOC_BYTES = 20 * 1024 * 1024 // 20 MB

export const POST = withAuth<Params>(async (req, { user, params }) => {
  const { id } = await params

  // Conversation kontrol
  const conv = await db.assistantConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!conv) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const kind = (formData.get('kind') as string | null) ?? 'document'
    const captionRaw = (formData.get('caption') as string | null) ?? ''
    const caption = captionRaw.slice(0, 500)

    if (!file) {
      return NextResponse.json({ error: 'no_file' }, { status: 400 })
    }

    // Boyut kontrolü
    const limit =
      kind === 'image' ? MAX_IMAGE_BYTES : kind === 'video' ? MAX_VIDEO_BYTES : MAX_DOC_BYTES
    if (file.size > limit) {
      return NextResponse.json(
        { error: 'file_too_large', limit, actual: file.size },
        { status: 413 }
      )
    }

    // Vercel Blob'a yükle
    const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase()
    const blobKey = `chat/${user.id}/${id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const uploaded = await put(blobKey, file, {
      access: 'public',
      contentType: file.type || undefined,
    })

    const attachment = {
      kind,
      url: uploaded.url,
      filename: file.name,
      size: file.size,
      mime: file.type,
      uploadedAt: new Date().toISOString(),
    }

    // AssistantMessage olarak kaydet — kullanıcı mesajı, attachment alanı ile
    const userMsg = await db.assistantMessage.create({
      data: {
        conversationId: id,
        role: 'user',
        content:
          caption ||
          `[${kind === 'image' ? 'Fotoğraf' : kind === 'video' ? 'Video' : 'Dosya'}: ${file.name}]`,
        attachments: [attachment] as Parameters<
          typeof db.assistantMessage.create
        >[0]['data']['attachments'],
      },
    })

    // Conversation güncelle
    await db.assistantConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    // Embed et (caption + filename)
    const embedText = caption ? `${caption} [${file.name}]` : `[${kind}: ${file.name}]`
    embedAndStoreMessage(userMsg.id, embedText).catch(() => {})

    return NextResponse.json({
      messageId: userMsg.id,
      attachment,
    })
  } catch (e) {
    console.error('[attachment/upload]', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'upload_failed' },
      { status: 500 }
    )
  }
})
