import { describe, it, expect, beforeEach } from 'vitest'
import { useNutritionCoachStore } from '../nutritionCoachStore'

describe('nutritionCoachStore', () => {
  beforeEach(() => {
    useNutritionCoachStore.getState().clearMessages()
  })

  describe('addMessage', () => {
    it('should add a user message', () => {
      useNutritionCoachStore.getState().addMessage('user', 'How much protein should I eat?')
      const messages = useNutritionCoachStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0].role).toBe('user')
      expect(messages[0].content).toBe('How much protein should I eat?')
    })

    it('should add an assistant message', () => {
      useNutritionCoachStore
        .getState()
        .addMessage('assistant', 'You should aim for 1.6-2.2g per kg of body weight.')
      const messages = useNutritionCoachStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0].role).toBe('assistant')
      expect(messages[0].content).toContain('1.6-2.2g')
    })

    it('should maintain conversation order', () => {
      useNutritionCoachStore.getState().addMessage('user', 'What about carbs?')
      useNutritionCoachStore.getState().addMessage('assistant', 'Carbs are important for energy.')
      useNutritionCoachStore.getState().addMessage('user', 'How many grams?')

      const messages = useNutritionCoachStore.getState().messages
      expect(messages).toHaveLength(3)
      expect(messages[0].role).toBe('user')
      expect(messages[1].role).toBe('assistant')
      expect(messages[2].role).toBe('user')
    })

    it('should handle multiple conversation turns', () => {
      const turns = [
        { role: 'user' as const, content: 'First question' },
        { role: 'assistant' as const, content: 'First answer' },
        { role: 'user' as const, content: 'Follow-up question' },
        { role: 'assistant' as const, content: 'Follow-up answer' },
      ]

      turns.forEach((turn) => {
        useNutritionCoachStore.getState().addMessage(turn.role, turn.content)
      })

      const messages = useNutritionCoachStore.getState().messages
      expect(messages).toHaveLength(4)
      expect(messages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant'])
    })
  })

  describe('clearMessages', () => {
    it('should clear all messages', () => {
      useNutritionCoachStore.getState().addMessage('user', 'Question 1')
      useNutritionCoachStore.getState().addMessage('assistant', 'Answer 1')
      expect(useNutritionCoachStore.getState().messages).toHaveLength(2)

      useNutritionCoachStore.getState().clearMessages()
      expect(useNutritionCoachStore.getState().messages).toHaveLength(0)
    })

    it('should clear to empty array', () => {
      useNutritionCoachStore.getState().addMessage('user', 'Question')
      useNutritionCoachStore.getState().clearMessages()
      const messages = useNutritionCoachStore.getState().messages
      expect(Array.isArray(messages)).toBe(true)
      expect(messages.length).toBe(0)
    })
  })

  describe('loading and error states', () => {
    it('should have default loading state as false', () => {
      expect(useNutritionCoachStore.getState().loading).toBe(false)
    })

    it('should have default error state as null', () => {
      expect(useNutritionCoachStore.getState().error).toBeNull()
    })

    it('should update loading state', () => {
      const store = useNutritionCoachStore.getState()
      expect(store.loading).toBe(false)
      store.setLoading(true)
      expect(useNutritionCoachStore.getState().loading).toBe(true)
      store.setLoading(false)
      expect(useNutritionCoachStore.getState().loading).toBe(false)
    })

    it('should update error state', () => {
      const store = useNutritionCoachStore.getState()
      expect(store.error).toBeNull()
      store.setError('Failed to get response')
      expect(useNutritionCoachStore.getState().error).toBe('Failed to get response')
      store.setError(null)
      expect(useNutritionCoachStore.getState().error).toBeNull()
    })
  })

  describe('message structure', () => {
    it('should maintain proper message structure', () => {
      useNutritionCoachStore.getState().addMessage('user', 'Test question')
      const message = useNutritionCoachStore.getState().messages[0]

      expect(message).toHaveProperty('role')
      expect(message).toHaveProperty('content')
      expect(typeof message.role).toBe('string')
      expect(typeof message.content).toBe('string')
    })

    it('should handle long messages', () => {
      const longMessage = 'a'.repeat(1000)
      useNutritionCoachStore.getState().addMessage('user', longMessage)
      const message = useNutritionCoachStore.getState().messages[0]
      expect(message.content).toBe(longMessage)
    })

    it('should handle empty content', () => {
      useNutritionCoachStore.getState().addMessage('user', '')
      const messages = useNutritionCoachStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0].content).toBe('')
    })
  })
})
