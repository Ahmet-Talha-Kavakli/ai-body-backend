/**
 * Sticker / GIF Mesaj Gönderimi — V3 Faz B4
 *
 * POST /api/assistant/conversations/[id]/sticker
 *   Body: { url, previewUrl?, kind: 'sticker' | 'gif', width?, height?, sourceId? }
 *
 * Tenor URL'i direkt attachment olarak kaydeder (Blob upload yok).
 * Kullanıcı mesajı oluşturur, embedlemeye sokar (alt-text varsa).
 *
 * Response: { messageId, attachment }
 */

import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { embedAndStoreMessage } from '@/lib/assistant/rag'

type Params = { params: Promise<{ id: string }> }

export const POST = withAuth<Params>(async (req, { user, params }) => {
  const { id } = await params

  const conv = await db.assistantConversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  })
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  let body: {
    url?: string
    previewUrl?: string
    kind?: string
    width?: number
    height?: number
    sourceId?: string
    title?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const url = (body.url ?? '').trim()
  const kind = body.kind === 'sticker' ? 'sticker' : body.kind === 'gif' ? 'gif' : null

  if (!url || !kind) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (!/^https:\/\/(media[0-9]?\.giphy\.com|i\.giphy\.com|giphy\.com)\//.test(url)) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  const attachment = {
    kind,
    url,
    previewUrl: body.previewUrl || url,
    width: typeof body.width === 'number' ? body.width : undefined,
    height: typeof body.height === 'number' ? body.height : undefined,
    sourceId: body.sourceId,
    title: body.title?.slice(0, 200),
    uploadedAt: new Date().toISOString(),
  }

  const userMsg = await db.assistantMessage.create({
    data: {
      conversationId: id,
      role: 'user',
      content: kind === 'sticker' ? '[Sticker]' : '[GIF]',
      attachments: [attachment] as Parameters<
        typeof db.assistantMessage.create
      >[0]['data']['attachments'],
    },
  })

  await db.assistantConversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  const embedText = body.title ? `[${kind}] ${body.title}` : `[${kind}]`
  embedAndStoreMessage(userMsg.id, embedText).catch(() => {})

  return NextResponse.json({ messageId: userMsg.id, attachment })
})
