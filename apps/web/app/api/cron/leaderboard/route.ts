import { NextRequest, NextResponse } from 'next/server'
import { aggregateLeaderboards } from '@/lib/jobs/leaderboard-aggregation'

// Protect with CRON_SECRET
const CRON_SECRET = process.env.CRON_SECRET || 'test_secret'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await aggregateLeaderboards()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Leaderboard cron error:', error)
    return NextResponse.json({ error: 'Failed to aggregate leaderboards' }, { status: 500 })
  }
}
