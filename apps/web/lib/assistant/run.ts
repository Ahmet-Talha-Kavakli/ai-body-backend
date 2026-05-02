/**
 * AI tool calling loop. Multi-step (AI → tool → AI).
 * Maks 5 round trip ile sonsuz döngüden korunur.
 */

import OpenAI from 'openai'
import { ALL_EXECUTORS, toOpenAIFunctions, ToolResult, getToolDefsForCategories } from './tools'

const MAX_ITERATIONS = 5

export interface RunMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
}

export interface ToolCallRecord {
  id: string
  name: string
  args: unknown
  result: ToolResult
}

export interface AssistantRunResult {
  finalText: string
  toolCalls: ToolCallRecord[]
}

/**
 * AI loop. Verilen messages dizisi ile gpt-4o'ya sorar; tool çağrı varsa
 * çalıştırır, yanıt geri verir, tekrar denedirir. Max iterasyon yetince durur.
 */
export async function runAssistant(args: {
  userId: string
  systemPrompt: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  userMessage: string
  model?: string
  maxTokens?: number
  toolCategories?: string[] | 'all'
}): Promise<AssistantRunResult> {
  const { userId, systemPrompt, history, userMessage } = args
  const model = args.model ?? 'gpt-4o'
  const maxTokens = args.maxTokens ?? 800
  const toolDefs = args.toolCategories ? getToolDefsForCategories(args.toolCategories) : undefined

  const openai = new OpenAI()
  const tools = toOpenAIFunctions(toolDefs)

  // OpenAI mesaj dizisi
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  const recordedToolCalls: ToolCallRecord[] = []

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: tools.length > 0 ? 'auto' : undefined,
      temperature: 0.8,
      max_tokens: maxTokens,
    })

    const choice = completion.choices[0]
    if (!choice) break
    const aiMsg = choice.message
    messages.push(aiMsg)

    // Tool çağrısı yoksa son turdayız
    if (!aiMsg.tool_calls?.length) {
      return {
        finalText: aiMsg.content?.trim() ?? '',
        toolCalls: recordedToolCalls,
      }
    }

    // Tool'ları paralel çalıştır
    const results = await Promise.all(
      aiMsg.tool_calls.map(async (tc) => {
        // OpenAI v5 type union; sadece function tipi destekliyoruz
        const fn = (tc as unknown as { function?: { name: string; arguments: string } }).function
        if (!fn) {
          return { tc, result: { ok: false, error: 'unsupported_tool_call_type' } as ToolResult }
        }
        let parsedArgs: unknown = {}
        try {
          parsedArgs = JSON.parse(fn.arguments || '{}')
        } catch {}
        const executor = ALL_EXECUTORS[fn.name]
        let result: ToolResult
        if (!executor) {
          result = { ok: false, error: `unknown_tool: ${fn.name}` }
        } else {
          try {
            result = (await executor.execute({ userId, params: parsedArgs })) as ToolResult
          } catch (e) {
            result = { ok: false, error: e instanceof Error ? e.message : 'unknown' }
          }
        }
        recordedToolCalls.push({
          id: tc.id,
          name: fn.name,
          args: parsedArgs,
          result,
        })
        return { tc, result }
      })
    )

    // Tool sonuçlarını mesajlara ekle
    for (const { tc, result } of results) {
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(result),
      })
    }
    // Loop devam, AI sonuçları görür ve yanıt üretir veya yeni tool çağırır
  }

  return {
    finalText: 'Bir şeyler ters gitti, tool döngüsü uzun sürdü. Tekrar deneyebilir misin?',
    toolCalls: recordedToolCalls,
  }
}
