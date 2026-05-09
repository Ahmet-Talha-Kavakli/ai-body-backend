/**
 * V4.5 — Claude Stream Client
 *
 * Karakter sohbeti için Claude Sonnet 4.5 + prompt caching.
 * gpt-4o klişeye düşüyor, Claude rol oynamada belirgin üstün.
 *
 * Maliyet:
 * - Sonnet input: $3/1M (cached: $0.30/1M, %90 indirim)
 * - Sonnet output: $15/1M
 * - Cache write: $3.75/1M (ilk yazımda %25 ekstra)
 *
 * Plan: docs/superpowers/plans/2026-05-06-character-realism.md (Faz 8 model upgrade)
 */

import Anthropic from '@anthropic-ai/sdk'

export const CLAUDE_MODEL_SONNET = 'claude-sonnet-4-5'
export const CLAUDE_MODEL_HAIKU = 'claude-haiku-4-5-20251001'

let _client: Anthropic | null = null
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

export interface ClaudeStreamArgs {
  systemPrompt: string
  /** Few-shot ve gerçek conversation history birlikte */
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  /** Yeni kullanıcı mesajı — en sonuna eklenir */
  userMessage: string
  maxTokens: number
  temperature?: number
  /** System prompt cache'lensin mi (true önerilir, %90 indirim) */
  cacheSystem?: boolean
}

/**
 * Claude'dan stream cevap üretir. SSE değil — async iterable text chunk.
 * Stream endpoint OpenAI-uyumlu format çıktısı verecek şekilde wrap edilebilir.
 */
export async function* streamClaudeMessage(
  args: ClaudeStreamArgs
): AsyncGenerator<{ type: 'text'; text: string } | { type: 'done'; usage: any }, void, unknown> {
  const client = getClient()

  // Final messages: history + son user mesajı
  const finalMessages = [...args.messages, { role: 'user' as const, content: args.userMessage }]

  // System prompt — cache_control ile ilk block cache'lenir
  const systemBlocks = args.cacheSystem
    ? ([
        {
          type: 'text' as const,
          text: args.systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ] as any)
    : args.systemPrompt

  // Overload retry + Haiku fallback
  const tryWithModel = async (model: string, attempt: number): Promise<any> => {
    try {
      return await client.messages.stream({
        model,
        max_tokens: args.maxTokens,
        temperature: args.temperature ?? 0.85,
        system: systemBlocks,
        messages: finalMessages,
      })
    } catch (e: any) {
      const isOverloaded =
        e?.status === 529 ||
        e?.error?.error?.type === 'overloaded_error' ||
        String(e?.message || '').includes('Overloaded')
      if (isOverloaded && attempt < 1) {
        await new Promise((r) => setTimeout(r, 1500))
        return tryWithModel(model, attempt + 1)
      }
      throw e
    }
  }

  const isOverloadedError = (e: any) =>
    e?.status === 529 ||
    e?.error?.error?.type === 'overloaded_error' ||
    String(e?.message || '').includes('Overloaded')

  let stream: any
  let activeModel = CLAUDE_MODEL_SONNET
  try {
    stream = await tryWithModel(CLAUDE_MODEL_SONNET, 0)
  } catch (e: any) {
    if (isOverloadedError(e)) {
      console.warn('[claude] Sonnet overloaded, falling back to Haiku')
      activeModel = CLAUDE_MODEL_HAIKU
      stream = await tryWithModel(CLAUDE_MODEL_HAIKU, 0)
    } else {
      throw e
    }
  }

  // Stream içinde overload event'i de yakala (initial connect değil, mid-stream fail)
  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text', text: event.delta.text }
      }
    }
    const final = await stream.finalMessage()
    yield { type: 'done', usage: final.usage }
  } catch (e: any) {
    if (isOverloadedError(e) && activeModel === CLAUDE_MODEL_SONNET) {
      console.warn('[claude] Mid-stream overload on Sonnet, retrying with Haiku')
      // Sonnet mid-stream patladı, Haiku ile baştan
      stream = await tryWithModel(CLAUDE_MODEL_HAIKU, 0)
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield { type: 'text', text: event.delta.text }
        }
      }
      const final = await stream.finalMessage()
      yield { type: 'done', usage: final.usage }
    } else {
      throw e
    }
  }
}

/**
 * Maliyet hesaplama (USD).
 */
export function calculateClaudeCost(usage: {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}): number {
  const INPUT = 3 / 1_000_000
  const OUTPUT = 15 / 1_000_000
  const CACHE_WRITE = 3.75 / 1_000_000
  const CACHE_READ = 0.3 / 1_000_000

  const cacheRead = usage.cache_read_input_tokens ?? 0
  const cacheWrite = usage.cache_creation_input_tokens ?? 0
  const regularInput = usage.input_tokens

  return (
    regularInput * INPUT +
    cacheWrite * CACHE_WRITE +
    cacheRead * CACHE_READ +
    usage.output_tokens * OUTPUT
  )
}
