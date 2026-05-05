/**
 * V4 Faz D — Karakter Sohbet Stream
 *
 * POST /api/assistant/characters/[characterId]/stream
 * Body: { content: string }
 *
 * Akış:
 *   1. Auth + karakter sahipliği kontrolü
 *   2. v4_characters flag kontrolü (yoksa 403)
 *   3. Karaktere özel AssistantConversation oluştur/al (characterId set)
 *   4. Hızlı karar katmanı
 *   5. Derin karar katmanı (gerekirse)
 *   6. Karakter system prompt + son N mesaj + graph context
 *   7. OpenAI stream
 *   8. Mesajları kaydet + ilişkiyi güncelle
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { db } from '@/lib/db/client'
import { withAuth } from '@/lib/api/with-auth'
import { isFlagEnabled } from '@/lib/assistant/feature-flags'
import { getCharacterTemplate } from '@/lib/assistant/character-templates'
import { buildCharacterSystemPrompt } from '@/lib/assistant/character-prompt'
import {
  fastDecisionLayer,
  deepDecisionLayer,
  decisionToPromptHint,
} from '@/lib/assistant/character-decision'
import {
  loadRelationshipSnapshot,
  updateRelationshipAfterInteraction,
} from '@/lib/assistant/character-relationship'
import { loadGraphContext, formatGraphContextForPrompt } from '@/lib/assistant/graph-context'
import { detectEmergency } from '@/lib/assistant/emergency'

export const maxDuration = 60

export const POST = withAuth(async (req, { user, params }) => {
  const enabled = await isFlagEnabled('v4_characters', user.id)
  if (!enabled) {
    return new NextResponse(JSON.stringify({ error: 'v4_characters_disabled' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const resolvedParams = params instanceof Promise ? await params : params
  const characterId = resolvedParams?.characterId
  if (typeof characterId !== 'string') {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Karakter sahipliği
  const character = await db.character.findFirst({
    where: { id: characterId, userId: user.id },
    include: {
      facts: { where: { superseded: false } },
    },
  })
  if (!character) return new NextResponse('Character not found', { status: 404 })

  // İçerik
  const body = await req.json().catch(() => ({}))
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) return new NextResponse('Empty content', { status: 400 })

  // Karakter template (Bible)
  // Karakter ismi → template key (basit eşleşme şu an, ileride Character.templateKey field olabilir)
  const template = getCharacterTemplate(character.name.toLowerCase())
  if (!template) {
    return new NextResponse(JSON.stringify({ error: 'template_not_found' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Karakterin sohbeti — yoksa oluştur
  let conversation = await db.assistantConversation.findFirst({
    where: { userId: user.id, characterId, archived: false },
    orderBy: { updatedAt: 'desc' },
  })
  if (!conversation) {
    conversation = await db.assistantConversation.create({
      data: {
        userId: user.id,
        characterId,
        title: character.name,
      },
    })
  }

  // User mesajı kaydet
  const userMsg = await db.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content,
    },
  })

  // İlişki snapshot
  const relationship = await loadRelationshipSnapshot(user.id, characterId)

  // Kullanıcı timezone'u
  const userRow = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, timezone: true },
  })
  const userTz = userRow?.timezone ?? 'Europe/Istanbul'
  const userLocalHour = new Date().toLocaleString('en-US', {
    timeZone: userTz,
    hour: 'numeric',
    hour12: false,
  })
  const localHour = parseInt(userLocalHour, 10) || 12

  // === ACİL DURUM (EMERGENCY OVERRIDE) ===
  // Karakterin durumu/ilişkisi ne olursa olsun (silent/broken bile),
  // kullanıcı kriz mesajı yazmışsa karakter bypass eder ve hayat kurtarır.
  // Kriz: intihar düşüncesi, fiziksel kritik (göğüs ağrısı, felç), tıbbi acil
  const emergency = detectEmergency(content)

  // === HIZLI KATMAN ===
  const fast = fastDecisionLayer({
    characterStatus: character.status as
      | 'active'
      | 'cold'
      | 'silent'
      | 'broken'
      | 'recovering'
      | 'departed',
    relationshipStatus: relationship?.status ?? null,
    characterMood: character.currentMood,
    userLocalHour: localHour,
  })

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }

      try {
        // === EMERGENCY OVERRIDE ===
        // Kullanıcı kriz mesajı yazdıysa: karakterin status'ü/mood'u ne olursa olsun
        // SOMUT acil hat bilgisi + destek mesajı dön. AI çağrısı YOK (deterministik).
        // Karakter küs/sessiz olsa bile bypass eder — hayat > küslük.
        if (emergency) {
          // Karakter persona prefix'i (Mia/Kerem'in kendi sesinden)
          const characterPrefix =
            relationship?.status === 'broken' || relationship?.status === 'silent'
              ? `Şu an seninle konuşmak istemiyordum ama bu önemli.\n\n`
              : ''

          const fullResponse = `${characterPrefix}${emergency.response}`

          const aiMsg = await db.assistantMessage.create({
            data: {
              conversationId: conversation!.id,
              role: 'assistant',
              content: fullResponse,
            },
          })

          // Stream et — UI'da chunk-by-chunk görünsün
          // Karakter küs/sessiz idiyse override ettik → 'cold' state'e düşür (make-up dönemi)
          if (relationship?.status === 'broken' || relationship?.status === 'silent') {
            await db.memoryRelationship
              .update({
                where: { userId_characterId: { userId: user.id, characterId } },
                data: { status: 'cold', recentMomentum: 0 },
              })
              .catch(() => {})
          }

          // RelationshipEvent log
          await db.relationshipEvent
            .create({
              data: {
                characterId,
                targetType: 'user',
                targetId: user.id,
                eventType: 'emergency_response',
                severity: 5,
                reason: emergency.type,
              },
            })
            .catch(() => {})

          send({ type: 'message_chunk', delta: fullResponse })
          send({ type: 'message_complete', messageId: aiMsg.id })
          controller.close()
          return
        }

        // SKIP — karakter cevap vermiyor
        if (fast.action === 'skip') {
          send({ type: 'skipped', reason: fast.reason })
          controller.close()
          return
        }

        // RESPOND_QUICK — şablon cevap
        if (fast.action === 'respond_quick' && fast.quickReply) {
          const aiMsg = await db.assistantMessage.create({
            data: {
              conversationId: conversation!.id,
              role: 'assistant',
              content: fast.quickReply,
            },
          })
          send({ type: 'message_chunk', delta: fast.quickReply })
          send({ type: 'message_complete', messageId: aiMsg.id })

          await updateRelationshipAfterInteraction({
            userId: user.id,
            characterId,
            delta: { momentumImpact: -0.2, reason: fast.reason },
          })
          controller.close()
          return
        }

        // DELAY
        if (fast.action === 'delay' && fast.delayMs) {
          await new Promise((r) => setTimeout(r, fast.delayMs))
        }

        // === DERİN KATMAN + GRAPH CONTEXT (PARALEL) ===
        // Önce son mesajları çek (her ikisinin de gerekli olduğu durum)
        const recentMessages = await db.assistantMessage.findMany({
          where: { conversationId: conversation!.id },
          orderBy: { createdAt: 'desc' },
          take: 12,
          select: { role: true, content: true },
        })
        const recentChrono = recentMessages
          .reverse()
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

        // Deep + Graph paralel — ikisi de userMessage'a bağlı, birbirinden bağımsız.
        // Bu paralelleştirme ~2-5sn kazandırıyor (mini AI ~2sn + embedding ~1sn).
        const [deep, graphNodes] = await Promise.all([
          deepDecisionLayer({
            characterId,
            characterName: character.name,
            recentMessages: recentChrono,
            userMessage: content,
            relationshipStatus: relationship?.status ?? null,
            characterMood: character.currentMood,
            intimacyDepth: relationship?.intimacyDepth ?? 0,
          }),
          loadGraphContext({ userId: user.id, userMessage: content }),
        ])

        const decisionHint = deep ? decisionToPromptHint(deep) : ''
        const graphContextBlock = formatGraphContextForPrompt(graphNodes)

        // === SYSTEM PROMPT ===
        const systemPrompt = buildCharacterSystemPrompt({
          template,
          state: {
            name: character.name,
            age: character.age,
            city: character.timezone === 'Europe/Istanbul' ? template.city : template.city,
            hometown: character.hometown,
            bio: character.bio ?? template.bio,
            currentMood: character.currentMood,
            currentActivity: character.currentActivity,
            currentLocation: character.currentLocation,
            lifePhase: character.lifePhase,
            currentStorylines: Array.isArray(character.currentStorylines)
              ? (character.currentStorylines as string[])
              : null,
            weeklyEnergy: character.weeklyEnergy,
            lastMajorEvent: character.lastMajorEvent,
          },
          relationship,
          user: { name: userRow?.name ?? null, timezone: userTz },
          characterFacts: character.facts.map((f) => ({ category: f.category, fact: f.fact })),
          graphContextBlock,
          decisionHint,
        })

        // === STREAM ===
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const startedAt = Date.now()
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemPrompt },
          ...recentChrono.map((m) => ({ role: m.role, content: m.content })),
        ]

        const stream2 = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          stream: true,
          temperature: 0.85,
          max_tokens:
            deep?.responseDepth === 'deep' ? 400 : deep?.responseDepth === 'medium' ? 200 : 120,
        })

        let fullText = ''
        let promptTokens = 0
        let completionTokens = 0

        for await (const chunk of stream2 as any) {
          const delta = chunk.choices?.[0]?.delta?.content ?? ''
          if (delta) {
            fullText += delta
            send({ type: 'message_chunk', delta })
          }
          // Usage info son chunk'ta gelir (bazı modellerde)
          if (chunk.usage) {
            promptTokens = chunk.usage.prompt_tokens ?? 0
            completionTokens = chunk.usage.completion_tokens ?? 0
          }
        }

        // AI mesajı kaydet
        const aiMsg = await db.assistantMessage.create({
          data: {
            conversationId: conversation!.id,
            role: 'assistant',
            content: fullText,
          },
        })
        send({ type: 'message_complete', messageId: aiMsg.id })

        // İlişki güncellemesi (pozitif etkileşim)
        await updateRelationshipAfterInteraction({
          userId: user.id,
          characterId,
          delta: {
            love: 1,
            trust: 0.5,
            intimacy: deep?.shareSecret ? 0.05 : 0.005,
            momentumImpact: 0.3,
            reason: 'normal_interaction',
          },
        })

        // AiCallLog
        try {
          await db.aiCallLog.create({
            data: {
              userId: user.id,
              characterId,
              model: 'gpt-4o-mini',
              provider: 'openai',
              purpose: 'chat',
              inputTokens: promptTokens,
              outputTokens: completionTokens,
              costUsd: (promptTokens * 0.15) / 1_000_000 + (completionTokens * 0.6) / 1_000_000,
              durationMs: Date.now() - startedAt,
            },
          })
        } catch {}

        controller.close()
      } catch (e) {
        send({ type: 'error', message: e instanceof Error ? e.message : 'unknown' })
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
})
