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
import { detectStatusDrama, buildStatusReplyContext } from '@/lib/assistant/status-drama'
import { buildV47Phase2Blocks } from '@/lib/assistant/v47-prompt-blocks'
import { detectTriggers, persistTriggers } from '@/lib/assistant/v47-trigger-detector'
import { detectAndPersistDisclosures } from '@/lib/assistant/v47-disclosure-detector'
import { buildV47Phase3Blocks } from '@/lib/assistant/v47-phase3-blocks'
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
import {
  checkBlockStatus,
  extractActionTags,
  applyBlockAction,
  loadMediationContextForCharacter,
  applyMediationTag,
} from '@/lib/assistant/blocking'
import { buildReunionBlock } from '@/lib/assistant/relationship-decay'
import { buildRelationshipTypeBlock } from '@/lib/assistant/relationship-types'
import { loadActiveGoals, buildGoalsBlock } from '@/lib/assistant/character-goals'
import { computeActiveMoodArc, buildMoodArcBlock } from '@/lib/assistant/mood-arc'
import {
  loadRecentThoughtsForRecall,
  buildThoughtRecallBlock,
} from '@/lib/assistant/character-thoughts'
import {
  checkBreakdownStatus,
  buildBoundariesBlock,
  checkLowMoodNoReason,
  buildLowMoodNoReasonBlock,
  triggerBreakdown,
} from '@/lib/assistant/character-boundaries'
import { detectBoundaryViolation } from '@/lib/assistant/boundary-violation-detector'
import { loadActiveBiologicalCycles, buildBiologicalBlock } from '@/lib/assistant/character-biology'
import { loadActivePartyEvent, buildPartyBlock } from '@/lib/assistant/character-party'
import { loadActiveDream, buildDreamBlock } from '@/lib/assistant/character-dreams-v46'
import {
  buildHabitsBlock,
  buildNPCCircleBlock,
  buildPastRelationshipsBlock,
  buildAvoidanceRightsBlock,
  buildJokeFollowupBlock,
  buildMirroringBlock,
  detectJokeIgnore,
} from '@/lib/assistant/character-traits-blocks'
import { loadCrossFriendContext } from '@/lib/assistant/cross-friend-context'
import {
  buildConversationBehaviorsBlock,
  loadEngagementImbalanceBlock,
  buildDistanceWaveBlock,
  loadMilestoneBlock,
  loadPetNamesBlock,
  loadUnfulfilledPromisesBlock,
} from '@/lib/assistant/character-conversation-behaviors'
import { buildSharedDataBlock } from '@/lib/assistant/data-share'
import { buildLocalEventsBlock } from '@/lib/assistant/world-monitor'
import { extractUrls, fetchAllPreviews, buildLinkPreviewBlock } from '@/lib/assistant/link-fetcher'
import { analyzeImage, buildVisionBlock } from '@/lib/assistant/vision-analyzer'
import {
  buildFinancialBlock,
  buildJealousyBlock,
  detectSevereViolation,
  buildVulnerabilityBlock,
  buildPhoneUnavailableBlock,
  loadRecentAppearanceChange,
  buildAppearanceBlock,
  isInActiveHours,
  loadActiveLocationStoryline,
  buildLocationBlock,
} from '@/lib/assistant/character-life-extras'
import {
  loadActiveRealAction,
  buildRealActionBlock,
  loadCharacterMusicTaste,
  buildMusicTasteBlock,
} from '@/lib/assistant/character-actions-music'
import { invalidateCache } from '@/lib/redis/client'
import { detectEmergency } from '@/lib/assistant/emergency'
import { getKnownPeopleForCharacter } from '@/lib/assistant/first-contact'
import { loadRecentEpisodes } from '@/lib/assistant/episodic-memory'
import { buildFewShotPairs, fewShotPairsToStyleBlock } from '@/lib/assistant/few-shot-builder'
import { streamClaudeMessage, calculateClaudeCost } from '@/lib/assistant/claude-client'
import { planMessageDelivery } from '@/lib/assistant/message-splitter'
import {
  synthesizeSpeech,
  DEFAULT_FEMALE_VOICE_ID,
  DEFAULT_MALE_VOICE_ID,
} from '@/lib/assistant/voice-tts'
import { toneToPromptBlock, type VoiceTone } from '@/lib/assistant/voice-stt'
import { put as blobPut } from '@vercel/blob'
import {
  loadCharacterMemoryFacts,
  memoryFactsToPromptBlock,
  extractAndSaveFacts,
} from '@/lib/assistant/character-memory-fact'
import { analyzeForRepeat, sanitizeFalseRepeat } from '@/lib/assistant/repeat-detector'
import {
  maybeUpdateConversationSummary,
  summaryToPromptBlock,
} from '@/lib/assistant/conversation-summarizer'
import { computeAvailability } from '@/lib/assistant/character-availability'
import {
  loadActiveStorylines,
  storylinesToPromptBlock,
  markStorylineTold,
} from '@/lib/assistant/character-storyline'
import { maybeBuildSecretShareTrigger, markSecretShared } from '@/lib/assistant/character-secret'
import {
  loadCharacterPerceptions,
  perceptionsToPromptBlock,
  markPerceptionTold,
} from '@/lib/assistant/inter-character'
import { maybeBuildMixupTrigger } from '@/lib/assistant/character-phone-mixup'
import { maybeBuildMisunderstanding } from '@/lib/assistant/misunderstanding-trigger'
import { buildRealismFlavorBlock } from '@/lib/assistant/realism-flavor'

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
      digitalProfile: true,
      writingStyle: true,
      introduction: true,
    },
  })
  if (!character) return new NextResponse('Character not found', { status: 404 })

  // İçerik
  const body = await req.json().catch(() => ({}))
  let content = typeof body.content === 'string' ? body.content.trim() : ''
  // Voice mode: content yerine transcript kullanılır (aşağıda voiceInput parse'tan sonra override edilecek)
  // V4.6 M59: media (foto/video) mode — content boş olabilir
  if (!content && !body.voice && !body.media)
    return new NextResponse('Empty content', { status: 400 })

  // V4.5 Madde 3 — Sesli mesaj modu
  // body.voice: { audioUrl, durationMs, tone, transcript } — transcribe endpoint'inden gelir
  const voiceInput: {
    audioUrl: string
    durationMs: number
    tone: VoiceTone
    transcript: string
  } | null =
    body.voice &&
    typeof body.voice.audioUrl === 'string' &&
    typeof body.voice.transcript === 'string'
      ? {
          audioUrl: body.voice.audioUrl,
          durationMs: Number(body.voice.durationMs) || 0,
          tone: body.voice.tone,
          transcript: body.voice.transcript,
        }
      : null

  // V4.6 M59 — Medya gönderimi (foto/video)
  // body.media: { url, type: 'image'|'video', metadata? }
  const mediaInput: {
    url: string
    type: 'image' | 'video'
    metadata?: Record<string, unknown>
  } | null =
    body.media &&
    typeof body.media.url === 'string' &&
    (body.media.type === 'image' || body.media.type === 'video')
      ? {
          url: body.media.url,
          type: body.media.type as 'image' | 'video',
          metadata: body.media.metadata,
        }
      : null

  // Voice ise content'i transcript yap — decision motoru ve prompt için
  if (voiceInput && !content) content = voiceInput.transcript.trim()
  if (!content && !mediaInput) return new NextResponse('Empty content', { status: 400 })
  // Medya ile gelen mesajda content boş olabilir — placeholder kullan
  if (!content && mediaInput)
    content = mediaInput.type === 'image' ? '[foto gönderdi]' : '[video gönderdi]'

  // V4.5 — Reply: kullanıcı belirli bir mesaja cevap veriyorsa
  const repliedToMessageId =
    typeof body.repliedToMessageId === 'string' ? body.repliedToMessageId : null
  let repliedToContext: { id: string; role: string; content: string } | null = null
  if (repliedToMessageId) {
    const target = await db.assistantMessage.findUnique({
      where: { id: repliedToMessageId },
      select: { id: true, role: true, content: true, conversationId: true },
    })
    if (target) {
      // Güvenlik: aynı conversation'dan olmalı
      repliedToContext = { id: target.id, role: target.role, content: target.content }
    }
  }

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

  // V4.6 M6 — Block kontrolü (mesajı kaydetmeden önce)
  const blockStatus = await checkBlockStatus(user.id, characterId)
  if (blockStatus.isBlocked) {
    return NextResponse.json(
      {
        ok: false,
        blocked: true,
        permanent: blockStatus.permanent,
        until: blockStatus.until,
        reason: blockStatus.reason,
      },
      { status: 403 }
    )
  }

  // V4.6 M29 — Sınır ihlali tespiti (cinsel baskı, aile saldırısı vs)
  const boundaryCheck = detectBoundaryViolation(content)
  if (boundaryCheck.violation && boundaryCheck.severity !== 'mild') {
    // Severity'ye göre breakdown süresi
    const days = boundaryCheck.severity === 'severe' ? 3 : 1
    await triggerBreakdown({
      characterId,
      reason: boundaryCheck.reason,
      durationDays: days,
    }).catch(() => {})
    // Mesajın gönderilmesi engellenmez — karakter cevabında breakdown tonunda olur
  }

  // V4.6 M21 — Geri dönüşsüz hata tespiti (auto trigger, gpt-4o-mini classifier)
  // Sadece "severe" seviye saldırılarda — normal hakaret M6 ile zaten engelleniyor
  // Async — stream'i bloke etmesin, fire-and-forget
  ;(async () => {
    try {
      const severe = await detectSevereViolation(content)
      if (severe.severe) {
        await db.memoryRelationship
          .update({
            where: { userId_characterId: { userId: user.id, characterId } },
            data: {
              permanentlyEnded: true,
              endedReason: severe.reason ?? severe.type ?? 'severe_violation',
              status: 'broken',
              tensionScore: 100,
            },
          })
          .catch(() => {})
      }
    } catch {}
  })()

  // V4.5 Faz 14 — pendingChainCount artır.
  // delivered + seen damgalaması availability check'ten SONRA yapılır
  // (aksi halde uyuyan karakter de hemen "gördü" olur).
  await db.character
    .update({
      where: { id: characterId },
      data: { pendingChainCount: { increment: 1 } },
    })
    .catch(() => {})

  // User mesajı kaydet
  // delivered/seen DAMGASI burada DEĞİL — availability check sonrası yapılır.
  // (Karakter uyuyorsa mesaj henüz "iletilmedi/görüldü" sayılmaz.)
  // V4.6 M59 — Foto analizi (kullanıcı resim attıysa Vision API)
  let visionAnalysisResult: Awaited<ReturnType<typeof analyzeImage>> = null
  if (mediaInput?.type === 'image') {
    visionAnalysisResult = await analyzeImage(mediaInput.url).catch(() => null)
  }

  // V4.6 M45 — Foto/sesli içerikte %15 ihtimalle "delayed view"
  // Karakter işteyken/uykudayken foto'ya hemen bakmaz, 2-12 saat sonra reaksiyon verir
  // Şu an basit: bu delay metaverisini user mesajına işaretle, prompt'ta sızdırılır
  let delayedViewUntil: Date | null = null
  if ((mediaInput || voiceInput) && Math.random() < 0.15) {
    const hours = 2 + Math.random() * 10
    delayedViewUntil = new Date(Date.now() + hours * 3600 * 1000)
  }

  const userMsg = await db.assistantMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: voiceInput ? voiceInput.transcript : content,
      ...(repliedToContext ? { repliedToMessageId: repliedToContext.id } : {}),
      // V4.5 Madde 3 — Sesli mesaj
      ...(voiceInput
        ? {
            audioUrl: voiceInput.audioUrl,
            audioDurationMs: voiceInput.durationMs,
            transcript: voiceInput.transcript,
          }
        : {}),
      // V4.6 M59 — Medya
      ...(mediaInput
        ? {
            mediaUrl: mediaInput.url,
            mediaType: mediaInput.type,
            mediaMetadata: (mediaInput.metadata ?? null) as object | null,
            visionAnalysis: (visionAnalysisResult ?? null) as object | null,
          }
        : {}),
      // V4.6 M45 — Delayed view
      ...(delayedViewUntil ? { delayedViewUntil } : {}),
    },
  })

  // V4.7 J7 — Voice observation kayıt (fire-and-forget)
  if (voiceInput?.tone) {
    void (async () => {
      try {
        const { recordVoiceObservation } = await import('@/lib/assistant/v47-voice-trend')
        await recordVoiceObservation({
          userId: user.id,
          messageId: userMsg.id,
          voiceTone: voiceInput.tone,
          durationMs: voiceInput.durationMs,
        })
      } catch (e) {
        console.error('[v47-voice-observation]', e)
      }
    })()
  }

  // V4.7 Faz 2 G1+G4 — Trigger detection (fire-and-forget, stream'i blokemeyecek)
  void (async () => {
    try {
      const classification = await detectTriggers(content)
      if (classification.reflectionTopic || classification.followUpTopic) {
        await persistTriggers({
          userId: user.id,
          characterId,
          triggerMessageId: userMsg.id,
          classification,
        })
      }
    } catch (e) {
      console.error('[v47-trigger-bg]', e)
    }
  })()

  // V4.7 Faz 3 M1 — Disclosure detection (fire-and-forget)
  void detectAndPersistDisclosures({
    userId: user.id,
    listenerCharId: characterId,
    userMessage: content,
  }).catch((e) => console.error('[v47-disclosure-bg]', e))

  // İlişki snapshot
  const relationship = await loadRelationshipSnapshot(user.id, characterId)

  // Kullanıcı timezone'u
  const userRow = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, timezone: true, physicalCity: true, physicalDistrict: true },
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

        // DELAY (decision motor)
        if (fast.action === 'delay' && fast.delayMs) {
          await new Promise((r) => setTimeout(r, fast.delayMs))
        }

        // === V4.5 Faz 14 — Karakter Müsaitlik / Yanıt Gecikmesi ===
        // Karakter uyuyor/meşgul/sinirli ise yanıtı geciktirir.
        // Dev'de süreler /30 küçültülür (DEV_FAST_DELAYS).
        // V4.6 M36 + M39 — aktif saatler + okuma süresi
        const charActiveHours = (character as unknown as { activeHours?: unknown }).activeHours
        const inActive = isInActiveHours(charActiveHours)
        const wordCount = content.trim().split(/\s+/).filter(Boolean).length
        const availability = computeAvailability({
          currentActivity: character.currentActivity,
          currentMood: character.currentMood,
          status: character.status,
          pendingChainCount: character.pendingChainCount ?? 0,
          hourLocal: localHour,
          userMessageWordCount: wordCount,
          outsideActiveHours: !inActive,
        })

        // Stream'i çok uzun bloklamayalım — Vercel max 60sn.
        // Eğer hesaplanan delay >55sn ise üst sınırı 55sn'e çek.
        const cappedDelay = Math.min(availability.delayMs, 55_000)

        if (cappedDelay > 0) {
          // Kullanıcıya bilgi yolla — UI durum gösterebilir
          send({
            type: 'delayed',
            reason: availability.reason,
            estimatedDelayMs: cappedDelay,
          })
          await new Promise((r) => setTimeout(r, cappedDelay))
        }

        // V4.5 Faz 14 — Karakter ŞİMDİ "ekrana baktı": delivered + seen damgala,
        // lastSeenAt güncelle. Bu nokta itibarıyla "yazıyor..." göstermek doğru.
        const seenAt = new Date()
        await db.assistantMessage
          .updateMany({
            where: {
              conversationId: conversation!.id,
              role: 'user',
              seenByCharacterAt: null,
            },
            data: {
              deliveredAt: seenAt,
              seenByCharacterAt: seenAt,
            },
          })
          .catch(() => {})
        await db.character
          .update({
            where: { id: characterId },
            data: { lastSeenAt: seenAt },
          })
          .catch(() => {})

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

        // Son AI cevabından bu yana biriken user mesajları (kullanıcı art arda yazdıysa hepsi)
        const pendingUserMessages: string[] = []
        for (let i = recentChrono.length - 1; i >= 0; i--) {
          const m = recentChrono[i]
          if (m.role === 'assistant') break
          pendingUserMessages.unshift(m.content)
        }

        // Deep + Graph + KnownPeople + EpisodicMemory + MemoryFacts + Storylines + Perceptions paralel
        const [
          deep,
          graphNodes,
          knownPeople,
          episodicMemory,
          memoryFacts,
          activeStorylines,
          perceptions,
        ] = await Promise.all([
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
          getKnownPeopleForCharacter(characterId, user.id).catch(() => []),
          loadRecentEpisodes(user.id, characterId, 2).catch(() => []),
          loadCharacterMemoryFacts({
            userId: user.id,
            characterId,
            forgetfulness: character.forgetfulness ?? 0.05,
          }).catch(() => []),
          loadActiveStorylines({ userId: user.id, characterId }).catch(() => []),
          loadCharacterPerceptions({ userId: user.id, characterId }).catch(() => []),
        ])

        const decisionHint = deep ? decisionToPromptHint(deep) : ''
        const graphContextBlock = formatGraphContextForPrompt(graphNodes)

        // === SYSTEM PROMPT ===
        const baseSystemPrompt = buildCharacterSystemPrompt({
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
          realism: {
            writingStyle: character.writingStyle
              ? {
                  punctuationLevel: character.writingStyle.punctuationLevel as
                    | 'clean'
                    | 'casual'
                    | 'messy',
                  capitalizationStyle: character.writingStyle.capitalizationStyle as
                    | 'proper'
                    | 'lowercase'
                    | 'mixed',
                  exclamationFreq: character.writingStyle.exclamationFreq,
                  ellipsisHabit: character.writingStyle.ellipsisHabit,
                  baseTypoRate: character.writingStyle.baseTypoRate,
                  educationLevel: character.writingStyle.educationLevel as
                    | 'low'
                    | 'medium'
                    | 'high'
                    | 'academic',
                  slangSet: character.writingStyle.slangSet,
                  avgSentenceLen: character.writingStyle.avgSentenceLen,
                  preferredSignOff: character.writingStyle.preferredSignOff,
                }
              : null,
            digitalProfile: character.digitalProfile
              ? {
                  emojiUsage: character.digitalProfile.emojiUsage as
                    | 'none'
                    | 'light'
                    | 'moderate'
                    | 'heavy',
                  emojiPreferred: character.digitalProfile.emojiPreferred,
                  gifUsage: character.digitalProfile.gifUsage,
                  stickerUsage: character.digitalProfile.stickerUsage,
                  voiceMessagePref: character.digitalProfile.voiceMessagePref as
                    | 'never'
                    | 'rare'
                    | 'often',
                  platform: character.digitalProfile.platform as
                    | 'whatsapp'
                    | 'instagram'
                    | 'sms'
                    | 'telegram',
                  device: character.digitalProfile.device as 'iphone' | 'android',
                  digitalLiteracy: character.digitalProfile.digitalLiteracy as
                    | 'low'
                    | 'medium'
                    | 'high',
                  linksOpenedRate: character.digitalProfile.linksOpenedRate,
                  shareMusicHabit: character.digitalProfile.shareMusicHabit,
                }
              : null,
            physicalCity: character.physicalCity,
            physicalDistrict: character.physicalDistrict,
            sleepSchedule:
              (character.sleepSchedule as {
                weekdayBed: string
                weekdayWake: string
                weekendBed: string
                weekendWake: string
              } | null) ?? null,
            userPhysicalCity: userRow?.physicalCity ?? null,
            userPhysicalDistrict: userRow?.physicalDistrict ?? null,
            userMessageContent: content,
            knownPeople,
            introductionReason: character.introduction?.reasonText ?? null,
            episodicMemory,
            replyContext: repliedToContext
              ? { role: repliedToContext.role, content: repliedToContext.content }
              : null,
          },
        })

        // V4.5 Faz 9B: Tekrar analizi — son user mesajları içinde gerçek tekrar var mı?
        const recentUserMessages = recentChrono
          .filter((m) => m.role === 'user')
          .map((m) => m.content)
          .slice(-8)
        const repeatAnalysis = analyzeForRepeat(content, recentUserMessages)
        const repeatBlock = repeatAnalysis.promptRule ? `\n\n${repeatAnalysis.promptRule}` : ''

        // V4.5 Faz 9A: Kalıcı hafıza fact'leri
        const memoryFactsBlock = memoryFactsToPromptBlock(
          memoryFacts,
          character.name,
          userRow?.name ?? null
        )
        const memoryFactsPrefix = memoryFactsBlock ? `\n\n${memoryFactsBlock}` : ''

        // V4.5 Madde 3: Sesli mesaj ton bloğu
        const voiceToneBlock = voiceInput ? `\n\n${toneToPromptBlock(voiceInput.tone)}` : ''

        // V4.5 Madde 3: Mia'nın voice cevap kararı
        // TEST SÜRECİ: kullanıcı sesli attıysa %100 sesli cevap (override).
        // Kullanıcı text attıysa: mood'a göre olasılık (genelde text kalır).
        const voiceReplyChanceMap: Record<string, number> = {
          happy: 0.15,
          excited: 0.2,
          sad: 0.1,
          anxious: 0.1,
          angry: 0.05,
          tired: 0.05,
          calm: 0.05,
          neutral: 0.05,
        }
        let baseVoiceChance = voiceReplyChanceMap[character.currentMood ?? 'neutral'] ?? 0.05
        // V4.6 M44 — Karakter voice preference + uzun mesaj boost
        const voicePref =
          (character as unknown as { voicePreference?: string }).voicePreference ?? 'medium'
        if (voicePref === 'high') baseVoiceChance += 0.2
        else if (voicePref === 'low') baseVoiceChance = Math.max(0, baseVoiceChance - 0.05)
        if (content.length > 80) baseVoiceChance += 0.05 // uzun mesaj → ses tercihi yüksek
        const userSentVoice = !!voiceInput
        const replyAsVoice = userSentVoice ? true : Math.random() < baseVoiceChance

        // V4.5 Faz 9C: Eski konuşma özeti
        const summaryBlock = summaryToPromptBlock(conversation?.runningSummary ?? null)

        // V4.5 Faz 11A: Aktif storyline'lar
        const storylinesBlock = storylinesToPromptBlock(activeStorylines, character.name)

        // Çoklu pending mesaj durumu — kullanıcı art arda yazdı, sen seç ne yapacağın
        let multiMessageBlock = ''
        if (pendingUserMessages.length >= 2) {
          const numbered = pendingUserMessages.map((m, i) => `${i + 1}. "${m}"`).join('\n')
          multiMessageBlock = `\n\n[KULLANICI ART ARDA ${pendingUserMessages.length} MESAJ ATTI — SEN KARAR VER]
Henüz cevap vermedin, bu mesajlar art arda geldi:
${numbered}

NASIL YAKLAŞ:
- Hepsine TEK BİR doğal cevap üret (bağlamı toplu değerlendir)
- VEYA en önemli 1-2 tanesine odaklan, diğerlerini doğal akışta cevapla
- VEYA ilgisiz / takıntılı / duplicate olanları görmezden gel — gerçek arkadaş gibi davran
- "Sırayla cevaplayayım" tarzı robotic format YAPMA — doğal, tek akış
- Her mesajı tek tek alıntılayıp cevaplama — toplu hisset, akıcı yaz
- Sıkıldıysan kısa kes ("ya yavaş yaz biraz")`
        }

        // V4.5 Faz 12A: Diğer karakterlerle etkileşim perception'ları
        const perceptionsBlock = perceptionsToPromptBlock(perceptions, character.name)

        // V4.5 Faz 13A: Yanlış anlama tetikleyicisi (nadir)
        const misunderstanding = maybeBuildMisunderstanding({
          userMessage: content,
          recentExchangeLength: recentChrono.length,
          characterMood: character.currentMood,
          sensitivityLevel: character.writingStyle?.baseTypoRate
            ? Math.min(1, (character.writingStyle.baseTypoRate ?? 0) * 5)
            : 0.3,
        })

        // V4.5 Faz 13B+13C: Mikro realizm flavor (tereddüt + kültürel referans)
        const realismFlavor = buildRealismFlavorBlock({
          hourLocal: localHour,
          dayOfWeek: new Date().getUTCDay(),
          characterAge: character.age,
          archetype: character.archetype,
        })

        // V4.5 Faz 12B: Telefon karışıklığı (nadir, eğlenceli)
        const mixup = await maybeBuildMixupTrigger({
          characterId,
          characterName: character.name,
          currentActivity: character.currentActivity,
        }).catch(() => ({ triggered: false, promptBlock: '' }))

        // V4.5 Faz 11B: Sır paylaşma trigger'ı
        const secretTrigger = await maybeBuildSecretShareTrigger({
          characterId,
          userId: user.id,
          intimacyDepth: relationship?.intimacyDepth ?? 0,
          recentUserMessage: content,
        }).catch(() => ({ shouldShare: false, secret: null, promptBlock: '' }))
        const secretBlock = secretTrigger.promptBlock

        // === FEW-SHOT (V4.5): Bible örneklerini fake conversation olarak inject et ===
        // Model klişe yerine bible stilini taklit eder.
        const decisionTone = decisionHint?.match(/Tonun:\s*(\w+)/)?.[1]
        const tzForHour =
          userTz === 'Europe/Istanbul' ? new Date().getUTCHours() + 3 : new Date().getUTCHours()
        const hourLocal = ((tzForHour % 24) + 24) % 24
        const fewShotPairs = buildFewShotPairs({
          template,
          userMessage: content,
          decisionTone,
          hourLocal,
        })
        // V4.5 Faz 9B FIX: Few-shot mesajlarını history'ye değil, system prompt'a koy.
        // Aksi halde Haiku bu örnekleri gerçek geçmiş sanıp "bunu daha önce yazdın" diyor.
        const fewShotStyleBlock = fewShotPairsToStyleBlock(fewShotPairs)

        // V4.6 M8 — Kullanıcı uzun süre yoktu, döndü?
        const reunionBlock = relationship
          ? (buildReunionBlock({
              daysSinceLastInteraction: relationship.daysSinceLastInteraction,
              relationshipType:
                (relationship as unknown as { relationshipType?: string }).relationshipType ??
                'acquaintance',
              loveScore: relationship.loveScore,
            }) ?? '')
          : ''

        // V4.6 M7 — İlişki tipi block'u
        const relTypeBlock = relationship
          ? buildRelationshipTypeBlock({
              currentType: ((relationship as unknown as { relationshipType?: string })
                .relationshipType ?? 'acquaintance') as
                | 'acquaintance'
                | 'friend'
                | 'close_friend'
                | 'best_friend'
                | 'dating'
                | 'partner'
                | 'engaged'
                | 'married'
                | 'fuckbuddy'
                | 'ex_partner'
                | 'enemy'
                | 'distant_relative',
              intensity:
                (relationship as unknown as { typeIntensity?: number }).typeIntensity ?? 50,
              pending:
                (
                  relationship as unknown as {
                    pendingTypeChange?: {
                      proposedType?: string
                      proposedAt?: string
                      status?: string
                    } | null
                  }
                ).pendingTypeChange ?? null,
              trust: relationship.trustScore,
              love: relationship.loveScore,
              familiarity:
                (relationship as unknown as { familiarityScore?: number }).familiarityScore ?? 0,
              daysAccumulated: relationship.accumulationDays,
            })
          : ''

        // V4.6 M6 — Aracılık context'i (Selin için: "Mia engelli, kullanıcı sana şunu yazdı")
        const mediationContext = await loadMediationContextForCharacter({
          userId: user.id,
          mediatorCharId: characterId,
        })
        const mediationBlock = mediationContext ? mediationContext + '\n\n' : ''

        // V4.6 Faz 3+4 paralel yüklemeler
        const characterCity = (character as unknown as { physicalCity?: string | null })
          .physicalCity
        const userUrls = extractUrls(content)
        const [
          activeGoals,
          moodArc,
          recentThoughts,
          breakdownStatus,
          lowMood,
          activeCycles,
          activeParty,
          activeDream,
          crossFriendBlock,
          engagementBlock,
          milestoneBlock,
          petNamesBlock,
          unfulfilledBlock,
          sharedDataBlock,
          localEventsBlock,
          linkPreviews,
        ] = await Promise.all([
          loadActiveGoals(characterId),
          computeActiveMoodArc(characterId),
          loadRecentThoughtsForRecall({ userId: user.id, characterId, withinDays: 30 }),
          checkBreakdownStatus(characterId),
          checkLowMoodNoReason(characterId),
          loadActiveBiologicalCycles(characterId),
          loadActivePartyEvent(characterId),
          loadActiveDream(characterId),
          loadCrossFriendContext({ userId: user.id, characterId, lookbackDays: 5 }),
          loadEngagementImbalanceBlock({
            userId: user.id,
            characterId,
            conversationId: conversation!.id,
          }),
          loadMilestoneBlock({ userId: user.id, characterId }),
          loadPetNamesBlock({ userId: user.id, characterId }),
          loadUnfulfilledPromisesBlock({ userId: user.id, characterId }),
          buildSharedDataBlock({ userId: user.id, characterId }),
          buildLocalEventsBlock({
            userId: user.id,
            characterCity,
            characterCountryCode: 'TR',
          }),
          userUrls.length > 0 ? fetchAllPreviews(userUrls) : Promise.resolve([]),
        ])
        const conversationBehaviorsBlock = buildConversationBehaviorsBlock()
        const distanceWaveBlock = buildDistanceWaveBlock()
        const linkPreviewBlock = buildLinkPreviewBlock(linkPreviews)
        const visionBlock = buildVisionBlock(visionAnalysisResult, mediaInput?.type ?? null)
        // V4.6 toparlama blokları
        const financialBlock = buildFinancialBlock(
          (character as unknown as { financialState?: unknown }).financialState
        )
        const jealousyBlock = await buildJealousyBlock({
          userId: user.id,
          characterId,
          loveScore: relationship?.loveScore ?? 50,
          relationshipType:
            (relationship as unknown as { relationshipType?: string })?.relationshipType ??
            'acquaintance',
        }).catch(() => '')
        const vulnerabilityBlock = buildVulnerabilityBlock({
          loveScore: relationship?.loveScore ?? 50,
          intimacyDepth: relationship?.intimacyDepth ?? 0,
        })
        const phoneUnavailBlock = buildPhoneUnavailableBlock({
          unavailableUntil:
            (character as unknown as { unavailableUntil?: Date | null }).unavailableUntil ?? null,
          unavailableReason:
            (character as unknown as { unavailableReason?: string | null }).unavailableReason ??
            null,
        })
        const recentAppearance = await loadRecentAppearanceChange(characterId).catch(() => null)
        const appearanceBlock = buildAppearanceBlock(recentAppearance)
        // M50 location storyline
        const activeLocation = await loadActiveLocationStoryline(characterId).catch(() => null)
        const locationBlock = buildLocationBlock(activeLocation)
        // M51 + M52
        const realAction = await loadActiveRealAction(characterId).catch(() => null)
        const realActionBlock = buildRealActionBlock(realAction)
        const musicTracks = await loadCharacterMusicTaste(characterId).catch(() => [])
        const musicBlock = buildMusicTasteBlock(musicTracks)

        // V4.6 M27 — Espri tutmadı tespiti (son AI mesajı + şu anki user mesajı)
        const lastAssistantMsg = await db.assistantMessage
          .findFirst({
            where: { conversationId: conversation!.id, role: 'assistant' },
            orderBy: { createdAt: 'desc' },
            select: { content: true },
          })
          .catch(() => null)
        const jokeStatus = detectJokeIgnore({
          lastAssistantContent: lastAssistantMsg?.content ?? null,
          currentUserContent: content,
        })
        const jokeFollowupBlock = buildJokeFollowupBlock(jokeStatus)

        // V4.6 M22 — Mirroring (user_speech_pattern memory fact'lerinden)
        const userSpeechFacts = await db.characterMemoryFact
          .findMany({
            where: {
              userId: user.id,
              characterId,
              category: 'user_speech_pattern',
              archived: false,
            },
            select: { content: true },
            take: 5,
          })
          .catch(() => [])
        const mirroringBlock = buildMirroringBlock(userSpeechFacts.map((f) => f.content))
        const goalsBlock = buildGoalsBlock(activeGoals)
        const moodArcBlock = buildMoodArcBlock(moodArc)
        const thoughtRecallBlock = buildThoughtRecallBlock(recentThoughts)
        const boundariesBlock = buildBoundariesBlock({
          inBreakdown: breakdownStatus.inBreakdown,
          breakdownReason: breakdownStatus.reason,
          breakdownEndsAt: breakdownStatus.endsAt,
        })
        const lowMoodBlock = buildLowMoodNoReasonBlock(lowMood.active)
        const biologicalBlock = buildBiologicalBlock(activeCycles)
        const partyBlock = buildPartyBlock(activeParty)
        const dreamBlock = buildDreamBlock(activeDream)
        // M16-M19 — karakter trait JSON field'ları
        const habitsBlock = buildHabitsBlock({
          dietary: (character as unknown as { dietaryHabits?: unknown }).dietaryHabits,
          addictions: (character as unknown as { addictions?: unknown }).addictions,
        })
        const npcBlock = buildNPCCircleBlock(
          (character as unknown as { npcCircle?: unknown }).npcCircle
        )
        const pastRelBlock = buildPastRelationshipsBlock(
          (character as unknown as { pastRelationships?: unknown }).pastRelationships
        )
        const avoidanceBlock = buildAvoidanceRightsBlock()

        // V4.6 M75 — Status drama + status reply context
        let statusDramaBlock = ''
        let statusReplyBlock = ''
        try {
          const drama = await detectStatusDrama(content, character.id, user.id)
          if (drama) statusDramaBlock = `\n\n${drama.promptBlock}`
        } catch (e) {
          console.error('[status-drama] error', e)
        }
        try {
          // Bu mesaj bir status'e cevap olarak mı atıldı? userMsg.attachments'a bak
          const lastReplyMsg = await db.assistantMessage.findFirst({
            where: {
              conversationId: conversation.id,
              role: 'user',
              attachments: { not: undefined as any },
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, attachments: true, createdAt: true },
          })
          if (lastReplyMsg && lastReplyMsg.id === userMsg.id) {
            const block = buildStatusReplyContext(lastReplyMsg.attachments)
            if (block) statusReplyBlock = `\n\n${block}`
          }
        } catch (e) {
          console.error('[status-reply-ctx] error', e)
        }

        // V4.7 Faz 2 — Hafıza + Zeka derinleştirme blokları
        let v47Phase2Block = ''
        try {
          v47Phase2Block = await buildV47Phase2Blocks({
            userId: user.id,
            characterId,
            mood: character.currentMood,
            trustScore: relationship?.trustScore ?? 0,
          })
        } catch (e) {
          console.error('[v47-phase2-blocks]', e)
        }

        // V4.7 Faz 3 — Sosyal grafik blokları
        let v47Phase3Block = ''
        try {
          v47Phase3Block = await buildV47Phase3Blocks({
            userId: user.id,
            characterId,
          })
        } catch (e) {
          console.error('[v47-phase3-blocks]', e)
        }

        // V4.7 Faz 4 — Karakter günlük gerçekliği (B4, I2, I3, I4, J5, D1)
        let v47Phase4Block = ''
        try {
          const { buildV47Phase4Blocks } = await import('@/lib/assistant/v47-phase4-blocks')
          v47Phase4Block = await buildV47Phase4Blocks({ characterId })
        } catch (e) {
          console.error('[v47-phase4-blocks]', e)
        }

        // V4.7 Faz 5 — İletişim derinliği Tur 1 (K8, K2, K6, K7, I5, I8)
        let v47Phase5Block = ''
        try {
          const { buildV47Phase5Blocks } = await import('@/lib/assistant/v47-phase5-blocks')
          v47Phase5Block = await buildV47Phase5Blocks({
            characterId,
            userId: user.id,
            mood: character.currentMood ?? null,
            loveScore: relationship?.loveScore ?? 50,
            jokeAggression: character.jokeAggression ?? 0.5,
            lastUserMessageLength: content?.length ?? 0,
          })
        } catch (e) {
          console.error('[v47-phase5-blocks]', e)
        }

        // V4.7 Faz 5 Tur 2 — Hassas kalibrasyon (K3, K4, K5, I6)
        let v47Phase5Tur2Block = ''
        try {
          const { buildV47Phase5Tur2Blocks } =
            await import('@/lib/assistant/v47-phase5-tur2-blocks')
          v47Phase5Tur2Block = await buildV47Phase5Tur2Blocks({
            characterId,
            userId: user.id,
            userMessage: content ?? '',
            loveScore: relationship?.loveScore ?? 50,
            swearTendency: character.swearTendency ?? 0.3,
          })
        } catch (e) {
          console.error('[v47-phase5-tur2-blocks]', e)
        }

        // V4.7 Faz 6 — Karakter Yetenekleri (B1, B2, D3, D4, D5, D8, J4)
        let v47Phase6Block = ''
        try {
          const { buildV47Phase6Blocks } = await import('@/lib/assistant/v47-phase6-blocks')
          v47Phase6Block = await buildV47Phase6Blocks({
            characterId,
            userId: user.id,
            userMessage: content ?? '',
            loveScore: relationship?.loveScore ?? 50,
          })
        } catch (e) {
          console.error('[v47-phase6-blocks]', e)
        }

        // V4.7 Faz 7 — Vulnerability + Anılar + Görsel (B6, B7, E1, E2, E3, E4, L1, L4, L5)
        let v47Phase7Block = ''
        try {
          const { buildV47Phase7Blocks } = await import('@/lib/assistant/v47-phase7-blocks')
          v47Phase7Block = await buildV47Phase7Blocks({
            characterId,
            userId: user.id,
            hasNewPhoto: false, // V4.6 photo upload akışı bu flag'i set edebilir ileride
          })
        } catch (e) {
          console.error('[v47-phase7-blocks]', e)
        }

        // V4.7 J7 — Voice trend dolaylı dürtme (flagged + henüz dile getirilmemiş)
        let v47VoiceTrendBlock = ''
        try {
          const { buildVoiceTrendBlock } = await import('@/lib/assistant/v47-voice-trend')
          v47VoiceTrendBlock = await buildVoiceTrendBlock({
            userId: user.id,
            loveScore: relationship?.loveScore ?? 50,
            trustScore: relationship?.trustScore ?? 50,
          })
        } catch (e) {
          console.error('[v47-voice-trend-block]', e)
        }

        // V4.7 J2 — Hazır araştırma sonucu
        let v47ResearchBlock = ''
        try {
          const { buildResearchSharingBlock } = await import('@/lib/assistant/v47-research')
          v47ResearchBlock = await buildResearchSharingBlock({
            characterId,
            userId: user.id,
          })
        } catch (e) {
          console.error('[v47-research-block]', e)
        }

        // I7 + I6 boundary detection — fire-and-forget (stream'i bloklamaz)
        try {
          const { recordJokeReactionIfNegative, recordSwearBoundaryIfNeeded } =
            await import('@/lib/assistant/v47-phase5-tur2-blocks')
          // Conversation ID — bu dosyada birkaç defa kullanılan değişken
          const conv = await db.assistantConversation.findFirst({
            where: { userId: user.id, characterId, archived: false },
            orderBy: { updatedAt: 'desc' },
            select: { id: true },
          })
          if (conv) {
            void recordJokeReactionIfNegative({
              characterId,
              userId: user.id,
              userMessage: content ?? '',
              conversationId: conv.id,
            }).catch((e) => console.error('[joke-reaction-detect]', e))
            void recordSwearBoundaryIfNeeded({
              characterId,
              userId: user.id,
              userMessage: content ?? '',
            }).catch((e) => console.error('[swear-boundary-detect]', e))
          }
        } catch (e) {
          console.error('[v47-phase5-tur2-detectors]', e)
        }

        // System prompt: tüm bloklar birleştirilir.
        const systemPrompt =
          baseSystemPrompt +
          conversationBehaviorsBlock +
          relTypeBlock +
          reunionBlock +
          mediationBlock +
          goalsBlock +
          moodArcBlock +
          lowMoodBlock +
          biologicalBlock +
          partyBlock +
          dreamBlock +
          habitsBlock +
          npcBlock +
          pastRelBlock +
          boundariesBlock +
          avoidanceBlock +
          thoughtRecallBlock +
          crossFriendBlock +
          engagementBlock +
          milestoneBlock +
          petNamesBlock +
          unfulfilledBlock +
          sharedDataBlock +
          localEventsBlock +
          linkPreviewBlock +
          visionBlock +
          distanceWaveBlock +
          jokeFollowupBlock +
          mirroringBlock +
          financialBlock +
          jealousyBlock +
          vulnerabilityBlock +
          phoneUnavailBlock +
          appearanceBlock +
          locationBlock +
          realActionBlock +
          musicBlock +
          summaryBlock +
          storylinesBlock +
          perceptionsBlock +
          multiMessageBlock +
          memoryFactsPrefix +
          repeatBlock +
          voiceToneBlock +
          secretBlock +
          mixup.promptBlock +
          misunderstanding.promptBlock +
          statusDramaBlock +
          statusReplyBlock +
          v47Phase2Block +
          v47Phase3Block +
          v47Phase4Block +
          v47Phase5Block +
          v47Phase5Tur2Block +
          v47Phase6Block +
          v47Phase7Block +
          v47VoiceTrendBlock +
          v47ResearchBlock +
          realismFlavor +
          fewShotStyleBlock

        // === STREAM ===
        // V4.5: Karakter sohbeti Claude Sonnet 4.5 + prompt caching
        // Sebep: gpt-4o klişeye düşüyordu ("seninle konuşmak keyifli" vs.)
        // Claude rol oynamada belirgin üstün. Maliyet caching ile düşer.
        const startedAt = Date.now()

        // V4.5 Faz 9B FIX: History'deki eski "iki kere yazdın" tarzı suçlamaları
        // temizle. Aksi halde Claude/Haiku eski mesajlardan bu pattern'i taklit ediyor.
        // Boş kalan mesajları da at — model history'de boşluk görmesin.
        const claudeHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
        for (const m of recentChrono) {
          let cleanContent = m.content
          if (m.role === 'assistant') {
            const sanitized = sanitizeFalseRepeat(m.content)
            if (sanitized.modified) cleanContent = sanitized.cleaned
          }
          if (cleanContent.trim().length === 0) continue
          claudeHistory.push({
            role: m.role as 'user' | 'assistant',
            content: cleanContent,
          })
        }

        let fullText = ''
        let usage: any = {}
        const maxTokens =
          deep?.responseDepth === 'deep' ? 400 : deep?.responseDepth === 'medium' ? 200 : 120

        try {
          for await (const event of streamClaudeMessage({
            systemPrompt,
            messages: claudeHistory,
            userMessage: content,
            maxTokens,
            temperature: 0.85,
            cacheSystem: true, // %90 indirim sonraki çağrılarda
          })) {
            if (event.type === 'text') {
              fullText += event.text
              send({ type: 'message_chunk', delta: event.text })
            } else if (event.type === 'done') {
              usage = event.usage
            }
          }
        } catch (err: any) {
          console.error('[claude-stream] error:', err?.message)
          send({ type: 'error', message: 'stream_failed' })
          throw err
        }

        const promptTokens = (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0)
        const completionTokens = usage.output_tokens ?? 0

        // V4.5 Faz 9B FIX: Tekrar suçlamasını HER ZAMAN sansürle.
        // Gerçek tekrar olsa bile "iki kere yazdın" demek bezdiriyor — doğal tepki yerine.
        const sanitizeResult = sanitizeFalseRepeat(fullText)
        if (sanitizeResult.modified) {
          console.warn(`[repeat] sanitized accusation (hasRepeat=${repeatAnalysis.hasRepeat})`)
          fullText = sanitizeResult.cleaned
        }

        // V4.6 M6 + M33 — Action tag'leri çıkar (BLOCK, MEDIATE_*, DELETE_AFTER).
        // Mesaj kullanıcıya gitmeden önce tag'ler kaldırılır, action uygulanır.
        const tagResult = extractActionTags(fullText)
        let scheduleDelete: { afterMs: number; reason: string | null } | null = null
        if (tagResult.tags.length > 0) {
          fullText = tagResult.cleanText || fullText
          for (const tag of tagResult.tags) {
            if (tag.type === 'DELETE_AFTER') {
              const sec = parseInt(tag.rest.seconds ?? '5', 10)
              scheduleDelete = {
                afterMs: Math.max(2000, Math.min(15000, sec * 1000)),
                reason: tag.reason ?? null,
              }
              continue
            }
            if (tag.type === 'BLOCK') {
              await applyBlockAction({
                userId: user.id,
                characterId,
                tag,
              }).catch((e) => console.error('[block] apply fail:', e))
            } else if (tag.type === 'MEDIATE_FORWARD' || tag.type === 'MEDIATE_REJECT') {
              // Mevcut pending mediation'ı resolve et
              const pending = await db.blockMediation
                .findFirst({
                  where: {
                    userId: user.id,
                    mediatorCharId: characterId,
                    status: 'pending',
                  },
                  orderBy: { createdAt: 'desc' },
                })
                .catch(() => null)
              if (pending) {
                await applyMediationTag({ mediationId: pending.id, tag }).catch((e) =>
                  console.error('[mediation] apply fail:', e)
                )
                // FORWARD ise: blocked karakter için tension biraz düşür, açma şansı artar
                if (tag.type === 'MEDIATE_FORWARD') {
                  await db.memoryRelationship
                    .update({
                      where: {
                        userId_characterId: {
                          userId: user.id,
                          characterId: pending.blockedCharId,
                        },
                      },
                      data: { tensionScore: { decrement: 15 } },
                    })
                    .catch(() => {})
                }
              }
            }
          }
        }

        // V4.5 Faz 7B — Çoklu mesaj bölme + smart limit
        // Decision motorundan gelen multiMessage / messageCount + kullanıcı mesaj uzunluğu
        // baz alınır. Kısa mesaja 4 parça yanıt verme engellenir.
        const userWordCount = content.trim().split(/\s+/).filter(Boolean).length
        const decisionMaxParts = deep?.multiMessage ? deep.messageCount : 1
        const plan = planMessageDelivery(fullText, {
          maxParts: decisionMaxParts,
          userMessageLength: userWordCount,
        })
        const firstPart = plan[0]?.content ?? fullText
        const restParts = plan.slice(1) // gecikmeli gönderilecekler

        // V4.5 Madde 3: Voice reply
        // Mia sesli cevap verecekse: TTS çalıştır, Blob'a yaz, mesaja audioUrl set
        // Sesli mesajlar split EDİLMEZ — tek bütün ses dosyası (gerçek WhatsApp gibi).
        let voiceOutput: { audioUrl: string; durationMs: number } | null = null
        if (replyAsVoice) {
          try {
            // Tüm cevabı TTS'e yolla (split kullanılmaz, doğal akış için)
            const ttsText = fullText.replace(/\n+/g, ' ').trim()
            const voiceId =
              character.voiceId ||
              (character.gender === 'male' ? DEFAULT_MALE_VOICE_ID : DEFAULT_FEMALE_VOICE_ID)
            const tts = await synthesizeSpeech(ttsText, {
              voiceId,
              mood: character.currentMood ?? 'neutral',
            })
            const blobKey = `voice/character/${characterId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`
            const uploaded = await blobPut(blobKey, tts.audioBuffer, {
              access: 'public',
              contentType: 'audio/mpeg',
            })
            // Yaklaşık süre: ~150 karakter/dk konuşma ≈ 400ms/karakter — kabaca
            const approxDurationMs = Math.round(ttsText.length * 70)
            voiceOutput = { audioUrl: uploaded.url, durationMs: approxDurationMs }
          } catch (e) {
            console.error('[tts] failed, falling back to text', e)
            voiceOutput = null
          }
        }

        // AI mesajı kaydet — voice ise audioUrl + tek mesaj, text ise sadece İLK parça
        const aiMsg = await db.assistantMessage.create({
          data: {
            conversationId: conversation!.id,
            role: 'assistant',
            content: voiceOutput ? fullText : firstPart,
            ...(voiceOutput
              ? {
                  audioUrl: voiceOutput.audioUrl,
                  audioDurationMs: voiceOutput.durationMs,
                  transcript: fullText,
                }
              : {}),
          },
        })

        // V4.7 Faz 6 — Post-stream detectors (D3 lie confess, D5 gift shared)
        try {
          const { markLieExposedIfConfessed, markGiftSuggestionShared } =
            await import('@/lib/assistant/v47-phase6-blocks')
          void markLieExposedIfConfessed({ characterId, characterReply: fullText }).catch((e) =>
            console.error('[v47-faz6-lie-mark]', e)
          )
          void markGiftSuggestionShared({
            characterId,
            userId: user.id,
            characterReply: fullText,
          }).catch((e) => console.error('[v47-faz6-gift-mark]', e))
        } catch (e) {
          console.error('[v47-phase6-postdetectors]', e)
        }

        // V4.7 Faz 7 — Post-stream detectors (L1 recap delivered, L5 memory recall)
        try {
          const { markAbsenceRecapDelivered, recordMemoryRecallIfPresent } =
            await import('@/lib/assistant/v47-phase7-blocks')
          void markAbsenceRecapDelivered({ characterId, userId: user.id }).catch((e) =>
            console.error('[v47-faz7-recap-mark]', e)
          )
          void recordMemoryRecallIfPresent({
            characterId,
            userId: user.id,
            characterReply: fullText,
          }).catch((e) => console.error('[v47-faz7-recall-record]', e))
        } catch (e) {
          console.error('[v47-phase7-postdetectors]', e)
        }

        // V4.7 J7 — Voice trend mention mark + J2 research shared mark
        try {
          const { markVoiceTrendFlaggedIfMentioned } =
            await import('@/lib/assistant/v47-voice-trend')
          void markVoiceTrendFlaggedIfMentioned({
            userId: user.id,
            characterReply: fullText,
          }).catch((e) => console.error('[v47-voice-trend-mark]', e))
          const { markResearchSharedIfMentioned } = await import('@/lib/assistant/v47-research')
          void markResearchSharedIfMentioned({
            characterId,
            userId: user.id,
            characterReply: fullText,
          }).catch((e) => console.error('[v47-research-mark]', e))
        } catch (e) {
          console.error('[v47-j7-j2-postdetectors]', e)
        }

        // V4.6 M33 — Karakter mesajını silme isteği varsa zamanla
        if (scheduleDelete) {
          const targetId = aiMsg.id
          const reason = scheduleDelete.reason
          setTimeout(() => {
            db.assistantMessage
              .update({
                where: { id: targetId },
                data: {
                  deletedByCharacterAt: new Date(),
                  originalContent: voiceOutput ? fullText : firstPart,
                  content: '',
                },
              })
              .catch(() => {})
          }, scheduleDelete.afterMs)
        }
        if (voiceOutput) {
          send({
            type: 'voice_message',
            messageId: aiMsg.id,
            audioUrl: voiceOutput.audioUrl,
            durationMs: voiceOutput.durationMs,
            transcript: fullText,
          })
        }
        // V4.7 A4 fix (2026-05-08): Sanitize tarafından mesaj temizlendiyse mobile'a
        // temiz hâli yolla. Mobile chunk'ları aldı ama bug cümle var; final
        // payload'dan temiz hâli alıp UI'da override etmesi gerek.
        send({
          type: 'message_complete',
          messageId: aiMsg.id,
          cleanContent: sanitizeResult.modified ? fullText : undefined,
        })

        // V4.5 Faz 9A — Hafıza extraction (arka plan, stream'i bloklamaz)
        extractAndSaveFacts({
          userId: user.id,
          characterId,
          characterName: character.name,
          userName: userRow?.name ?? null,
          recentExchange: [
            { role: 'user', content },
            { role: 'assistant', content: fullText },
          ],
          sourceMessageId: aiMsg.id,
        }).catch(() => {})

        // V4.5 Faz 9C — Conversation summarization (arka plan)
        maybeUpdateConversationSummary({ conversationId: conversation!.id }).catch(() => {})

        // V4.5 Faz 11A — Storyline'dan bahsedilirse toldUser işaretle
        markStorylineTold({
          userId: user.id,
          characterId,
          aiResponse: fullText,
        }).catch(() => {})

        // V4.5 Faz 11B — Sır paylaşıldıysa damgala
        if (secretTrigger.shouldShare && secretTrigger.secret) {
          markSecretShared({
            characterId,
            secretTitle: secretTrigger.secret.title,
          }).catch(() => {})
        }

        // V4.5 Faz 12A — Diğer karakter adı geçtiyse perception'ı toldUser işaretle
        markPerceptionTold({
          userId: user.id,
          characterId,
          aiResponse: fullText,
        }).catch(() => {})

        // Kalan parçaları zamanlanmış mesajlara yaz (cron tarafından gönderilir)
        // Voice modunda parçalama yok — tek bütün ses dosyası gönderildi.
        if (!voiceOutput && restParts.length > 0) {
          const batchId = aiMsg.id // aynı seriye işaretle
          const now = Date.now()
          await Promise.all(
            restParts.map((part, idx) =>
              db.scheduledCharacterMessage.create({
                data: {
                  userId: user.id,
                  characterId,
                  conversationId: conversation!.id,
                  content: part.content,
                  scheduledFor: new Date(now + part.delayMs),
                  status: 'pending',
                  partOfBatch: batchId,
                  partIndex: idx + 1,
                },
              })
            )
          )
        }

        // V4.5 Faz 14 — Karakter cevap verdi, pending chain count sıfırla
        await db.character
          .update({
            where: { id: characterId },
            data: { pendingChainCount: 0, lastSeenAt: new Date() },
          })
          .catch(() => {})

        // V4.5 Perf: liste cache invalidate
        invalidateCache(`chars:list:${user.id}`).catch(() => {})

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
              model: 'claude-sonnet-4-5',
              provider: 'anthropic',
              purpose: 'chat',
              inputTokens: promptTokens,
              outputTokens: completionTokens,
              // Claude maliyet (cache dahil)
              costUsd: calculateClaudeCost(usage),
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
