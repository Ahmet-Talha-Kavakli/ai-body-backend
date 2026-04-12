import { NextRequest, NextResponse } from 'next/server'
import { aggregateLeaderboards } from '@/lib/jobs/leaderboard-aggregation'
import { isValidCronRequest } from '@/lib/env/validate'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!isValidCronRequest(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await aggregateLeaderboards()
    return NextResponse.json(result)
  } catch (error) {
    logger.error({ err: error }, 'Leaderboard cron error:')
    return NextResponse.json({ error: 'Failed to aggregate leaderboards' }, { status: 500 })
  }
}
