import { describe, it, expect } from 'vitest'
import { buildMemoryBlock, injectMemoryIntoPrompt } from '../prompt-injector'
import type { MemoryContext } from '../types'

describe('Prompt Injector', () => {
  describe('buildMemoryBlock', () => {
    it('returns empty string when no memories', () => {
      const block = buildMemoryBlock([])
      expect(block.trim().length).toBe(0)
    })

    it('formats memories with proper structure', () => {
      const memories = [
        'User usually squats 100kg for 5 reps',
        'Prefers morning workouts',
      ]
      const block = buildMemoryBlock(memories)

      expect(block).toContain('User Profile')
      expect(block).toContain('100kg')
      expect(block).toContain('morning')
    })

    it('limits memory block to reasonable length', () => {
      const longMemories = Array(10).fill('This is a very long memory text that repeats many times')
      const block = buildMemoryBlock(longMemories)

      // Should be reasonable length, not gigantic
      expect(block.length).toBeLessThan(2000)
    })
  })

  describe('injectMemoryIntoPrompt', () => {
    it('injects memory block into system prompt', () => {
      const originalPrompt = 'You are a fitness coach.'
      const context: MemoryContext = {
        memories: ['User is beginner level'],
        totalRetrieved: 1,
        types: ['SESSION_SUMMARY'],
      }

      const injected = injectMemoryIntoPrompt(originalPrompt, context)

      expect(injected).toContain('You are a fitness coach')
      expect(injected).toContain('beginner')
    })

    it('preserves original prompt content', () => {
      const originalPrompt = 'Answer user questions about fitness accurately.'
      const context: MemoryContext = {
        memories: [],
        totalRetrieved: 0,
        types: [],
      }

      const injected = injectMemoryIntoPrompt(originalPrompt, context)

      expect(injected).toContain('fitness')
    })

    it('handles empty memory context gracefully', () => {
      const prompt = 'Base prompt'
      const context: MemoryContext = {
        memories: [],
        totalRetrieved: 0,
        types: [],
      }

      expect(() => injectMemoryIntoPrompt(prompt, context)).not.toThrow()
    })
  })
})
