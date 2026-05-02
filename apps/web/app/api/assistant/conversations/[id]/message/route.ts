import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { loadAssistantContext } from '@/lib/assistant/context'
import { buildSystemPrompt } from '@/lib/assistant/system-prompt'
import { runAssistant } from '@/lib/assistant/run'
import { extractAndStoreFacts } from '@/lib/assistant/memory-extractor'
import { embedAndStoreMessage, searchSimilarMessages } from '@/lib/assistant/rag'
import { maybeEvolvePersonality } from '@/lib/assistant/personality-evolver'

type Ctx = { params: Promise<{ id: string }> }

const FALLBACK = 'Şu an cevap veremiyorum. Tekrar dener misin?'

export const POST = withAuth<Ctx>(async (req, { user, params }) => {
  const { id } = await params
  const body = (await req.json()) as { content: string }
  const content = body.content?.trim()
  if (!content) return NextResponse.json({ error: 'empty' }, { status: 400 })

  const conv = await db.assistantConversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
  })
  if (!conv) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // 1. Kullanıcı mesajını kaydet
  const userMessage = await db.assistantMessage.create({
    data: { conversationId: id, role: 'user', content },
  })

  // 1.5. Embedding (background)
  embedAndStoreMessage(userMessage.id, content).catch(() => {})

  // 2. İlk gerçek user mesajıysa title güncelle
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

  // 3. Context yükle (paralel: facts + people + events + env + RAG search)
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
    return NextResponse.json({ error: 'profile_missing' }, { status: 400 })
  }

  const ragContext = ragResults.map((r) => {
    const date = r.createdAt.toISOString().slice(0, 10)
    const role = r.role === 'user' ? 'Kullanıcı' : (ctx.profile?.name ?? 'AI')
    return `[${date}] ${role} ("${r.conversationTitle}"): ${r.content.slice(0, 200)}`
  })

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

  // 4. AI Run (tool calling loop)
  let aiContent = FALLBACK
  let toolCallsLog: unknown = null
  try {
    const result = await runAssistant({
      userId: user.id,
      systemPrompt,
      history: conv.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      userMessage: content,
    })
    aiContent = result.finalText || FALLBACK
    if (result.toolCalls.length) {
      toolCallsLog = result.toolCalls
    }
  } catch (e) {
    console.error('[assistant/message]', e)
  }

  // 5. AI mesajını kaydet
  const aiMessage = await db.assistantMessage.create({
    data: {
      conversationId: id,
      role: 'assistant',
      content: aiContent,
      toolCalls: toolCallsLog as Parameters<
        typeof db.assistantMessage.create
      >[0]['data']['toolCalls'],
    },
  })

  // 5.5. AI mesaj embedding (background)
  embedAndStoreMessage(aiMessage.id, aiContent).catch(() => {})

  // 5.7. Memory extraction (background — kullanıcıyı bekletmez)
  extractAndStoreFacts({
    userId: user.id,
    userMessage: content,
    aiResponse: aiContent,
    sourceMessageId: userMessage.id,
  }).catch(() => {})

  // 5.8. Personality evolution (her 20 mesajda bir tetiklenir)
  maybeEvolvePersonality(user.id).catch(() => {})

  await db.assistantConversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({ userMessage, aiMessage })
})
