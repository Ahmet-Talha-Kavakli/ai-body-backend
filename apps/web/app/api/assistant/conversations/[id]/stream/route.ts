import { NextRequest } from 'next/server'
import { auth, verifyToken } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { loadAssistantContext } from '@/lib/assistant/context'
import { buildSystemPrompt, buildLightSystemPrompt } from '@/lib/assistant/system-prompt'
import { runAssistantStream, StreamEvent } from '@/lib/assistant/run-stream'
import { extractAndStoreFacts } from '@/lib/assistant/memory-extractor'
import { embedAndStoreMessage, searchSimilarMessages } from '@/lib/assistant/rag'
import { maybeEvolvePersonality } from '@/lib/assistant/personality-evolver'
import { detectEmergency } from '@/lib/assistant/emergency'
import { routeMessage, modelForDifficulty, maxTokensForDifficulty } from '@/lib/assistant/router'
import { analyzeTone, toneToPromptHint } from '@/lib/assistant/tone-analyzer'
import { detectLifeEvent, lifeEventToPromptHint } from '@/lib/assistant/life-event-detector'
import {
  maybeCreateLevel1Summary,
  loadSummaryContext,
  formatSummaryContextForPrompt,
} from '@/lib/assistant/summary-builder'
import { moodToPromptHint, maybeShiftMood, Mood } from '@/lib/assistant/mood-engine'
import { detectHostility } from '@/lib/assistant/hostility-detector'
import { evaluateHonesty, honestyToPromptHint } from '@/lib/assistant/honesty-evaluator'
import {
  processHostility,
  checkAndResetExpiredBlock,
  relationshipStateToPromptHint,
  isBlocked,
  RelationshipState,
} from '@/lib/assistant/relationship-engine'

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

  // V3 Faz A: Engelleme süresi dolmuş mu? Doluysa state'i hafiflet
  await checkAndResetExpiredBlock(user.id).catch(() => {})

  // Kullanıcı mesajını hemen kaydet
  const userMessage = await db.assistantMessage.create({
    data: { conversationId: id, role: 'user', content },
  })
  embedAndStoreMessage(userMessage.id, content).catch(() => {})

  // V3 Faz A: Hostility tespit ve eskalasyon (kullanıcı mesajı kaydedildikten sonra)
  const hostility = await detectHostility(content).catch(() => null)
  if (hostility?.isHostile) {
    await processHostility({
      userId: user.id,
      hostility,
      triggerMessageId: userMessage.id,
    }).catch(() => null)
  }

  // Mevcut ilişki durumu — engellendiyse cevap verme
  const currentProfile = await db.assistantProfile.findUnique({
    where: { userId: user.id },
    select: { relationshipState: true, blockedUntil: true },
  })
  const currentState = (currentProfile?.relationshipState ?? 'normal') as RelationshipState

  if (isBlocked(currentState)) {
    // Engelli olsak bile acil durum kontrolü — hayat AI'nın küsmüşlüğünden önemli
    const blockedEmergency = detectEmergency(content)
    if (blockedEmergency) {
      // Soğuk-ama-orada bir yanıt: ön cümle olarak küs olduğunu hatırlat,
      // sonra hayat hattı + acil yönlendirme. Tonu donmuş gibi.
      const coldPrefix =
        currentState === 'blocked' ? 'Şu an seninle konuşmak istemiyorum ama bu önemli. ' : ''
      const emergencyText = coldPrefix + blockedEmergency.response

      // AI mesajı olarak kaydet (kayıt önemli — "AI burada müdahele etti" delili)
      const aiMessage = await db.assistantMessage.create({
        data: {
          conversationId: id,
          role: 'assistant',
          content: emergencyText,
          toolCalls: [
            {
              id: 'emergency-while-blocked',
              name: '_emergency_through_block',
              args: { type: blockedEmergency.type, hotline: blockedEmergency.hotline },
              result: { ok: true },
            },
          ] as Parameters<typeof db.assistantMessage.create>[0]['data']['toolCalls'],
        },
      })
      embedAndStoreMessage(aiMessage.id, emergencyText).catch(() => {})

      // Engelleme süresini erken bitir — kullanıcı kritik anda yalnız kalmasın
      // ve barışma evresine geç (cold)
      await db.assistantProfile.update({
        where: { userId: user.id },
        data: {
          relationshipState: 'cold',
          blockedUntil: null,
          relationshipStateChangedAt: new Date(),
        },
      })
      const lastBlock = await db.blockEvent.findFirst({
        where: { userId: user.id, endedAt: null },
        orderBy: { startedAt: 'desc' },
        select: { id: true },
      })
      if (lastBlock) {
        await db.blockEvent.update({
          where: { id: lastBlock.id },
          data: { endedAt: new Date() },
        })
      }

      // SSE response — emergency yanıtı stream et
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          const enq = (event: object) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          }
          enq({ type: 'thinking' })
          enq({ type: 'user_message_id', userMessageId: userMessage.id })
          // Yavaş chunk chunk yaz
          ;(async () => {
            for (let i = 0; i < emergencyText.length; i += 8) {
              enq({ type: 'text_delta', text: emergencyText.slice(i, i + 8) })
              await new Promise((r) => setTimeout(r, 25))
            }
            enq({ type: 'done', finalText: emergencyText, toolCalls: [] })
            enq({ type: 'saved', aiMessageId: aiMessage.id })
            controller.close()
          })()
        },
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
        },
      })
    }

    // Acil durum yoksa engelleme uygulanır
    return new Response(
      `data: ${JSON.stringify({
        type: 'blocked',
        blockedUntil: currentProfile?.blockedUntil?.toISOString() ?? null,
      })}\n\n`,
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
        },
      }
    )
  }

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

      // V2 Faz N: Multi-model router — maliyet optimizasyonu
      const recentContext = conv.messages
        .slice(-3)
        .map((m) => `${m.role}: ${m.content.slice(0, 80)}`)
        .join(' | ')

      // V2 Chunk 4 + V3 Faz A: Router + tone + life event + summary context paralel
      const [route, toneAnalysis, lifeEvent, summaryCtx] = await Promise.all([
        routeMessage({ message: content, recentContext }),
        analyzeTone(content),
        detectLifeEvent(content),
        loadSummaryContext(user.id),
      ])
      const selectedModel = modelForDifficulty(route.difficulty)
      const selectedMaxTokens = maxTokensForDifficulty(route.difficulty)
      const tonePromptHint = toneToPromptHint(toneAnalysis)
      const lifeEventHint = lifeEvent ? lifeEventToPromptHint(lifeEvent) : ''
      const summaryHint = formatSummaryContextForPrompt(summaryCtx)

      // V3 Faz A: Honesty evaluator — tone'a bağlı, sonra çağrılır (skip kuralları için)
      // Sadece risk ihtimali olan mesajlarda devreye girer, üzgün/yorgun durumda skip eder.
      const honestyEval = await evaluateHonesty({
        userMessage: content,
        recentContext,
        tone: toneAnalysis,
      }).catch(() => null)
      const honestyHint = honestyEval ? honestyToPromptHint(honestyEval) : ''

      // Easy/medium → light system prompt (~1500 token), hard → full prompt (~6000 token)
      const profileSafe = ctx.profile!
      const baseSystemPrompt =
        route.difficulty === 'hard'
          ? buildSystemPrompt({
              profile: profileSafe,
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
          : buildLightSystemPrompt({
              profile: profileSafe,
              user: ctx.user,
              facts: ctx.facts,
              people: ctx.people,
              greetingContext: ctx.greetingContext,
              isNewConversation,
              grantedCapabilities: ctx.grantedCapabilities,
            })
      // V3 Faz A: mood hint
      const moodHint = profileSafe.currentMood
        ? moodToPromptHint(profileSafe.currentMood as Mood, profileSafe.moodReason ?? null)
        : ''
      // V3 Faz A: relationship hint (cold / silent / warning / normal)
      const relationshipHint = relationshipStateToPromptHint(
        (profileSafe.relationshipState ?? 'normal') as RelationshipState
      )

      // Sistem prompt'a tüm hint'leri ekle
      const systemPrompt =
        baseSystemPrompt +
        moodHint +
        relationshipHint +
        summaryHint +
        tonePromptHint +
        lifeEventHint +
        honestyHint

      // Easy + tool-less mesajlarda hiç tool gönderme (büyük tasarruf)
      // Listen modunda veya yaşam olayı varsa tool gönderme — kullanıcı duygusal an yaşıyor
      const isListenMode =
        toneAnalysis.supportNeeded === 'listen' ||
        (toneAnalysis.tone !== 'neutral' &&
          toneAnalysis.tone !== 'happy' &&
          toneAnalysis.intensity > 0.6)
      const isLifeEventMode = !!lifeEvent && lifeEvent.severity !== 'minor'
      const toolCategoriesParam =
        isListenMode || isLifeEventMode
          ? []
          : route.difficulty === 'easy' && route.toolCategories.length === 0
            ? []
            : route.toolCategories.length > 0
              ? route.toolCategories
              : 'all'

      console.log(
        `[router] ${route.difficulty} → ${selectedModel} | tone: ${toneAnalysis.tone}(${toneAnalysis.intensity.toFixed(1)},${toneAnalysis.supportNeeded}) | event: ${lifeEvent?.event ?? 'none'} | tools: ${Array.isArray(toolCategoriesParam) ? toolCategoriesParam.join(',') || 'NONE' : 'all'}`
      )

      try {
        await runAssistantStream({
          userId: user.id,
          systemPrompt,
          // V2 Faz N: history limit — son 12 mesaj yeter (eski hep gidiyordu)
          history: conv.messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .slice(-12)
            .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          userMessage: content,
          model: selectedModel,
          maxTokens: selectedMaxTokens,
          toolCategories: toolCategoriesParam,
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
        maybeEvolvePersonality(user.id).catch(() => {})
        // V3 Faz A: hierarchical memory compression Level 1 tetikleyici
        maybeCreateLevel1Summary(user.id, id).catch(() => {})

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

        // Yaşam olayı varsa yüksek importance ile DB'ye kaydet
        if (lifeEvent) {
          try {
            await db.assistantMemoryFact.create({
              data: {
                userId: user.id,
                category: 'life_event',
                content: lifeEvent.summary,
                eventType: lifeEvent.event,
                importance: lifeEvent.severity === 'life_changing' ? 5 : 4,
                confidence: 0.95,
                sourceMessageId: userMessage.id,
              },
            })
            // V3 Faz A: gün içi mood kayma — life event mood'u değiştirir
            const negativeEvents = ['death', 'job_loss', 'breakup', 'diagnosis']
            const positiveEvents = ['birth', 'wedding', 'new_job', 'pregnancy', 'graduation']
            if (negativeEvents.includes(lifeEvent.event)) {
              maybeShiftMood({ userId: user.id, trigger: 'life_event_negative' }).catch(() => {})
            } else if (positiveEvents.includes(lifeEvent.event)) {
              maybeShiftMood({ userId: user.id, trigger: 'life_event_positive' }).catch(() => {})
            }
            send({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              type: 'memory_saved' as any,
              facts: [
                {
                  category: 'life_event',
                  content: lifeEvent.summary,
                },
              ],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          } catch (e) {
            console.error('[life-event-save]', e)
          }
        }

        // Memory extraction — stream'i bitirmeden önce await et ki UI'a bildirim ulaşsın
        // Conversation içindeki user mesaj sayısını ver, her 3 mesajda bir çalışacak
        try {
          const userMsgCount = await db.assistantMessage.count({
            where: { conversationId: id, role: 'user' },
          })
          const newFacts = await extractAndStoreFacts({
            userId: user.id,
            userMessage: content,
            aiResponse: finalText,
            sourceMessageId: userMessage.id,
            conversationId: id,
            userMessageCountInConversation: userMsgCount,
          })
          if (newFacts && newFacts.length > 0) {
            send({
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              type: 'memory_saved' as any,
              facts: newFacts,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any)
          }
        } catch {}
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
