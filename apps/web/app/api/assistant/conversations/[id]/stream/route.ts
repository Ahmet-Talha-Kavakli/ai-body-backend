import { NextRequest } from 'next/server'
import { auth, verifyToken } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { loadAssistantContext } from '@/lib/assistant/context'
import { buildSystemPrompt } from '@/lib/assistant/system-prompt'
import { runAssistantStream, StreamEvent } from '@/lib/assistant/run-stream'
import { extractAndStoreFacts } from '@/lib/assistant/memory-extractor'
import { embedAndStoreMessage, searchSimilarMessages } from '@/lib/assistant/rag'
import { maybeEvolvePersonality } from '@/lib/assistant/personality-evolver'
import { detectEmergency } from '@/lib/assistant/emergency'

type Ctx = { params: Promise<{ id: string }> }

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      })
      return payload.sub ?? null
    } catch {
      return null
    }
  }
  const { userId } = await auth()
  return userId
}

export async function POST(req: NextRequest, routeCtx: Ctx) {
  const clerkId = await resolveUserId(req)
  if (!clerkId) return new Response('Unauthorized', { status: 401 })
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await routeCtx.params
  const body = (await req.json()) as { content: string }
  const content = body.content?.trim()
  if (!content) {
    return new Response('empty', { status: 400 })
  }

  const conv = await db.assistantConversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
  })
  if (!conv) {
    return new Response('not_found', { status: 404 })
  }

  // Kullanıcı mesajını hemen kaydet
  const userMessage = await db.assistantMessage.create({
    data: { conversationId: id, role: 'user', content },
  })
  embedAndStoreMessage(userMessage.id, content).catch(() => {})

  // Title güncelle (ilk gerçek mesajsa)
  if (conv.messages.filter((m) => m.role === 'user').length === 0) {
    const title = content.slice(0, 60).replace(/\n/g, ' ')
    await db.assistantConversation.update({
      where: { id },
      data: { title, updatedAt: new Date() },
    })
  } else {
    await db.assistantConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    })
  }

  // Context yükle
  const [ctx, ragResults] = await Promise.all([
    loadAssistantContext(user.id),
    searchSimilarMessages({
      userId: user.id,
      query: content,
      excludeConversationId: id,
      limit: 6,
    }).catch(() => []),
  ])
  if (!ctx.profile) {
    return new Response('profile_missing', { status: 400 })
  }

  const ragContext = ragResults.map((r) => {
    const date = r.createdAt.toISOString().slice(0, 10)
    const role = r.role === 'user' ? 'Kullanıcı' : (ctx.profile?.name ?? 'AI')
    return `[${date}] ${role} ("${r.conversationTitle}"): ${r.content.slice(0, 200)}`
  })

  // V2 (Faz L3): yeni sohbet mi (kullanıcının ilk mesajı)?
  const isNewConversation = conv.messages.filter((m) => m.role === 'user').length === 0

  const systemPrompt = buildSystemPrompt({
    profile: ctx.profile,
    user: ctx.user,
    facts: ctx.facts,
    people: ctx.people,
    recentEvents: ctx.recentEvents,
    environment: ctx.environment,
    ragContext,
    greetingContext: ctx.greetingContext,
    isNewConversation,
    grantedCapabilities: ctx.grantedCapabilities,
  })

  // SSE stream başlat
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        const payload = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // Run başlat
      let finalText = ''
      let toolCallsLog: unknown = null
      let aiMessageId: string | null = null

      // İlk olarak userMessageId'yi gönder ki client optimistic mesajı eşleştirebilsin
      send({ type: 'thinking' } as StreamEvent)
      send({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'user_message_id' as any,
        userMessageId: userMessage.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      // ⚡ ACİL DURUM TARAMASI — AI çağırmadan önce
      const emergency = detectEmergency(content)
      if (emergency) {
        // AI çağırmadan direkt acil yanıtı stream et (chunk chunk)
        const text = emergency.response
        for (let i = 0; i < text.length; i += 8) {
          send({ type: 'text_delta', text: text.slice(i, i + 8) })
          await new Promise((r) => setTimeout(r, 25))
        }
        finalText = emergency.response

        const aiMessage = await db.assistantMessage.create({
          data: {
            conversationId: id,
            role: 'assistant',
            content: finalText,
            toolCalls: [
              {
                id: 'emergency',
                name: '_emergency',
                args: { type: emergency.type, hotline: emergency.hotline },
                result: { ok: true },
              },
            ] as Parameters<typeof db.assistantMessage.create>[0]['data']['toolCalls'],
          },
        })
        aiMessageId = aiMessage.id
        embedAndStoreMessage(aiMessage.id, finalText).catch(() => {})

        await db.assistantConversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        })

        send({ type: 'done', finalText, toolCalls: [] })
        send({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: 'saved' as any,
          aiMessageId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        controller.close()
        return
      }

      try {
        await runAssistantStream({
          userId: user.id,
          systemPrompt,
          history: conv.messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          userMessage: content,
          emit: (event) => {
            if (event.type === 'text_delta') {
              finalText += event.text
            }
            if (event.type === 'done') {
              finalText = event.finalText
              toolCallsLog = event.toolCalls.length ? event.toolCalls : null
            }
            send(event)
          },
        })

        // AI mesajını kaydet
        const aiMessage = await db.assistantMessage.create({
          data: {
            conversationId: id,
            role: 'assistant',
            content: finalText,
            toolCalls: toolCallsLog as Parameters<
              typeof db.assistantMessage.create
            >[0]['data']['toolCalls'],
          },
        })
        aiMessageId = aiMessage.id
        embedAndStoreMessage(aiMessage.id, finalText).catch(() => {})
        extractAndStoreFacts({
          userId: user.id,
          userMessage: content,
          aiResponse: finalText,
          sourceMessageId: userMessage.id,
        }).catch(() => {})
        maybeEvolvePersonality(user.id).catch(() => {})

        await db.assistantConversation.update({
          where: { id },
          data: { updatedAt: new Date() },
        })

        // Final saved event
        send({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          type: 'saved' as any,
          aiMessageId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      } catch (e) {
        send({ type: 'error', message: e instanceof Error ? e.message : 'unknown' })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
