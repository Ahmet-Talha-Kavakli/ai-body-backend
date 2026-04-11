// apps/web/lib/memory/index.ts
export {
  writeSessionMemory,
  writeWeeklyMemory,
  calculateImportance,
  calculateDecayScore,
} from './memory-writer'

export { retrieveMemoryContext, rankByRelevance } from './memory-retriever'

export { injectMemoryIntoPrompt, buildMemoryBlock } from './prompt-injector'

export { buildSessionMemoryText } from './session-summarizer'
export { buildWeeklyMemoryText } from './weekly-summarizer'

export type {
  MemoryType,
  MemoryContext,
  SessionMemoryInput,
  WeeklyMemoryInput,
  SessionMemoryTextResult,
} from './types'
