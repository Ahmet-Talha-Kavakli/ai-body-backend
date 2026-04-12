import type { MemoryContext } from './types'

/**
 * Build a memory block for injection into prompts
 * Formats memories with structure and context
 */
export function buildMemoryBlock(memories: string[]): string {
  if (!memories || memories.length === 0) {
    return ''
  }

  // Limit to first 5 memories to avoid prompt bloat
  const limitedMemories = memories.slice(0, 5)

  let block = '\n---\n## User Profile & History\n\n'
  block += 'Based on recent sessions and patterns, here is relevant context about this user:\n\n'

  for (let i = 0; i < limitedMemories.length; i++) {
    block += `• ${limitedMemories[i]}\n`
  }

  block += '\n---\n'

  return block
}

/**
 * Inject memory context into an AI prompt
 * Inserts user-relevant memories after the system prompt intro
 */
export function injectMemoryIntoPrompt(basePrompt: string, context: MemoryContext): string {
  // Build memory block
  const memoryBlock = buildMemoryBlock(context.memories)

  // If no memories, return original prompt
  if (!memoryBlock.trim()) {
    return basePrompt
  }

  // Find a good insertion point (after first sentence/paragraph)
  // Insert after the first period + space, or at the beginning if no period
  const firstPeriodIndex = basePrompt.indexOf('. ')
  const insertionIndex = firstPeriodIndex !== -1 ? firstPeriodIndex + 2 : 0

  if (insertionIndex === 0) {
    // No period found, insert at beginning
    return memoryBlock + '\n' + basePrompt
  }

  // Insert after first sentence
  const beforeMemory = basePrompt.substring(0, insertionIndex)
  const afterMemory = basePrompt.substring(insertionIndex)

  return beforeMemory + '\n' + memoryBlock + '\n' + afterMemory
}
