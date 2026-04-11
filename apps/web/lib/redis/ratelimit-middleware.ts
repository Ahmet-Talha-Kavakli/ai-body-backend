import { NextResponse } from 'next/server'
import { aiRatelimit, apiRatelimit } from '@/lib/redis/client'

export async function withAiRateLimit(userId: string) {
  const { success, limit, reset, remaining } = await aiRatelimit.limit(userId)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }
  return null
}

export async function withApiRateLimit(userId: string) {
  const { success, limit, reset, remaining } = await apiRatelimit.limit(userId)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }
  return null
}
