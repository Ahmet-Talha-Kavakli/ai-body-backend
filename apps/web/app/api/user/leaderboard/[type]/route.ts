import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const LEADERBOARD_TYPES = ['form_score', 'most_consistent', 'strongest', 'best_recovery'] as const
type LeaderboardType = typeof LEADERBOARD_TYPES[number]

const PERIODS = ['weekly', 'monthly', 'all_time'] as const
type Period = typeof PERIODS[number]

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
): Promise<NextResponse> {
  try {
    const { userId: clerkId } = auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { type } = await params

    // Get period from query params (default to 'weekly')
    const period = (req.nextUrl.searchParams.get('period') || 'weekly') as Period

    // Validate leaderboard type
    if (!LEADERBOARD_TYPES.includes(type as LeaderboardType)) {
      return NextResponse.json(
        { error: `Invalid leaderboard type. Must be one of: ${LEADERBOARD_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate period
    if (!PERIODS.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${PERIODS.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch leaderboard from database
    const leaderboard = await db.leaderboard.findUnique({
      where: {
        leaderboardType_period: {
          leaderboardType: type,
          period: period
        }
      }
    })

    if (!leaderboard) {
      // Return empty leaderboard if not found
      return NextResponse.json({
        success: true,
        leaderboard: {
          leaderboardType: type,
          period: period,
          entries: [],
          updatedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      leaderboard: {
        leaderboardType: leaderboard.leaderboardType,
        period: leaderboard.period,
        entries: leaderboard.entries,
        updatedAt: leaderboard.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
