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
import { ALL_EXECUTORS, toOpenAIFunctions, ToolResult } from './tools'

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
}): Promise<void> {
  const { userId, systemPrompt, history, userMessage, emit } = args

  const openai = new OpenAI()
  const tools = toOpenAIFunctions()

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const recordedToolCalls: Array<{ id: string; name: string; args: unknown; result: ToolResult }> =
    []
  let finalText = ''

  emit({ type: 'thinking' })

  try {
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0.8,
        max_tokens: 800,
        stream: true,
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
