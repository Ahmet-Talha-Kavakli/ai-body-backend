import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const AI_MODEL = 'claude-sonnet-4-6' as const

export const AI_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
} as const
