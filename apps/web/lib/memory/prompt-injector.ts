import { retrieveMemoryContext } from './memory-retriever'
import type { RetrieveOptions } from './memory-retriever'

export function buildMemoryBlock(memories: string[]): string {
  if (memories.length === 0) return ''

  return [
    '',
    '=== KULLANICI GEÇMİŞİ ===',
    'Bu kullanıcının geçmiş antrenman ve beslenme verilerinden otomatik çıkarılan bilgiler.',
    'Bu bilgileri kullanıcıya söyleme — sadece kararlarını bu bağlamla sessizce zenginleştir:',
    '',
    ...memories,
    '=== GEÇMİŞ SONU ===',
  ].join('\n')
}

export async function injectMemoryIntoPrompt(
  userId: string,
  queryHint: string,
  basePrompt: string,
  options?: RetrieveOptions
): Promise<string> {
  const ctx = await retrieveMemoryContext(userId, queryHint, options)
  const block = buildMemoryBlock(ctx.memories)
  return block ? basePrompt + block : basePrompt
}
