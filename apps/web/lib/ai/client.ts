import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export const AI_MODEL = 'gpt-4o-mini' as const

export const AI_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
} as const
