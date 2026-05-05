/**
 * Streaming AI run. Tool calling loop + token streaming.
 *
 * Olay tipleri (caller'a verilir):
 * - { type: 'thinking' }                 — başlangıç
 * - { type: 'tool_start', name, args }
 * - { type: 'tool_end', name, result }
 * - { type: 'text_delta', text }         — AI cevap token'ı
 * - { type: 'done', finalText, toolCalls }
 * - { type: 'error', message }
 */

import OpenAI from 'openai'
import { ALL_EXECUTORS, toOpenAIFunctions, ToolResult, getToolDefsForCategories } from './tools'

const MAX_ITERATIONS = 5

export type StreamEvent =
  | { type: 'thinking' }
  | { type: 'tool_start'; toolCallId: string; name: string; args: unknown }
  | { type: 'tool_end'; toolCallId: string; name: string; result: ToolResult }
  | { type: 'text_delta'; text: string }
  | {
      type: 'done'
      finalText: string
      toolCalls: Array<{ id: string; name: string; args: unknown; result: ToolResult }>
    }
  | { type: 'error'; message: string }

export async function runAssistantStream(args: {
  userId: string
  systemPrompt: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  userMessage: string
  emit: (event: StreamEvent) => void
  // V2 Faz N: router parametreleri
  model?: string // default 'gpt-4o'
  maxTokens?: number // default 800
  toolCategories?: string[] | 'all' // default 'all'
  // V3 Faz B — Vision desteği (multimodal user mesajı)
  imageUrls?: string[]
}): Promise<void> {
  const { userId, systemPrompt, history, userMessage, emit } = args
  const model = args.model ?? 'gpt-4o'
  const maxTokens = args.maxTokens ?? 800
  const toolDefs = args.toolCategories ? getToolDefsForCategories(args.toolCategories) : undefined
  const imageUrls = args.imageUrls ?? []

  const openai = new OpenAI()
  const tools = toOpenAIFunctions(toolDefs)

  // V3 Faz B — Image varsa multimodal content, yoksa düz text
  const userContent: OpenAI.Chat.ChatCompletionUserMessageParam['content'] =
    imageUrls.length > 0
      ? [
          ...(userMessage ? [{ type: 'text' as const, text: userMessage }] : []),
          ...imageUrls.map((url) => ({
            type: 'image_url' as const,
            image_url: { url, detail: 'auto' as const },
          })),
        ]
      : userMessage

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ]

  const recordedToolCalls: Array<{ id: string; name: string; args: unknown; result: ToolResult }> =
    []
  let finalText = ''

  emit({ type: 'thinking' })

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const stream = await openai.chat.completions.create({
        model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: 0.8,
        max_tokens: maxTokens,
        stream: true,
        stream_options: { include_usage: true },
      })

      // Bu turun parçalarını topla
      let turnContent = ''
      const turnToolCalls: Array<{
        id: string
        name: string
        argsStr: string
        emitted: boolean
      }> = []

      for await (const chunk of stream) {
        // Usage chunk (last chunk when include_usage: true)
        if (chunk.usage) {
          const u = chunk.usage
          // Yaklaşık maliyet hesaplama (USD)
          const isMini = model.includes('mini')
          const inRate = isMini ? 0.15 / 1_000_000 : 2.5 / 1_000_000
          const outRate = isMini ? 0.6 / 1_000_000 : 10 / 1_000_000
          const cost = u.prompt_tokens * inRate + u.completion_tokens * outRate
          console.log(
            JSON.stringify({
              tag: 'cost',
              cost_usd: parseFloat(cost.toFixed(6)),
              model,
              in: u.prompt_tokens,
              out: u.completion_tokens,
              tools: tools.length,
            })
          )
        }
        const delta = chunk.choices[0]?.delta
        if (!delta) continue

        // Text token
        if (delta.content) {
          turnContent += delta.content
          finalText += delta.content
          emit({ type: 'text_delta', text: delta.content })
        }

        // Tool call delta'ları
        const tcDeltas = delta.tool_calls
        if (tcDeltas) {
          for (const td of tcDeltas) {
            const idx = td.index ?? 0
            if (!turnToolCalls[idx]) {
              turnToolCalls[idx] = { id: '', name: '', argsStr: '', emitted: false }
            }
            if (td.id) turnToolCalls[idx]!.id = td.id
            const fn = (td as unknown as { function?: { name?: string; arguments?: string } })
              .function
            if (fn?.name) turnToolCalls[idx]!.name += fn.name
            if (fn?.arguments) turnToolCalls[idx]!.argsStr += fn.arguments
          }
        }
      }

      // Bu turda tool call yoksa: bitmiş sayılır
      if (turnToolCalls.length === 0) {
        emit({ type: 'done', finalText, toolCalls: recordedToolCalls })
        return
      }

      // Mesaj history'sine assistant'ın bu turdaki yanıtını ekle (tool_calls dahil)
      messages.push({
        role: 'assistant',
        content: turnContent || null,
        tool_calls: turnToolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: { name: tc.name, arguments: tc.argsStr },
        })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)

      // Tool'ları paralel çalıştır
      await Promise.all(
        turnToolCalls.map(async (tc) => {
          let parsedArgs: unknown = {}
          try {
            parsedArgs = JSON.parse(tc.argsStr || '{}')
          } catch {}
          emit({ type: 'tool_start', toolCallId: tc.id, name: tc.name, args: parsedArgs })

          const executor = ALL_EXECUTORS[tc.name]
          let result: ToolResult
          if (!executor) {
            result = { ok: false, error: `unknown_tool: ${tc.name}` }
          } else {
            try {
              result = (await executor.execute({ userId, params: parsedArgs })) as ToolResult
            } catch (e) {
              result = { ok: false, error: e instanceof Error ? e.message : 'unknown' }
            }
          }
          recordedToolCalls.push({ id: tc.id, name: tc.name, args: parsedArgs, result })
          emit({ type: 'tool_end', toolCallId: tc.id, name: tc.name, result })

          // Tool sonucunu mesaj history'sine ekle
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          })
        })
      )
      // Loop devam — AI yeni turu (tool sonuçlarını görür) başlatır
    }

    emit({
      type: 'done',
      finalText: finalText || 'Bir şeyler ters gitti, tekrar dener misin?',
      toolCalls: recordedToolCalls,
    })
  } catch (e) {
    emit({ type: 'error', message: e instanceof Error ? e.message : 'unknown' })
  }
}
