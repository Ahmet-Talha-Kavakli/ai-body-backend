import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { PLANS, canUseFeatureWithLimit } from '@/lib/stripe/plans'
import { logger } from '@/lib/logger'

/**
 * GET /api/subscription/usage
 * Returns the current user's feature usage for this month
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })

    if (!user || !user.subscription) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tier = user.subscriptionTier
    const limits = PLANS[tier]

    return NextResponse.json({
      tier,
      usage: {
        sessions: {
          used: 0,
          limit: limits.sessionsPerMonth,
          canUse: true,
        },
        aiPrograms: {
          used: 0,
          limit: limits.aiPrograms,
          canUse: true,
        },
        aiMeals: {
          used: 0,
          limit: limits.aiMeals,
          canUse: true,
        },
        aiCoach: {
          used: 0,
          limit: limits.aiCoach,
          canUse: true,
        },
      },
      features: {
        wearableSync: limits.wearableSync,
        advancedAnalytics: limits.advancedAnalytics,
        prioritySupport: limits.prioritySupport,
      },
      usageResetAt: new Date(),
    })
  } catch (error) {
    logger.error({ err: error }, 'GET /api/subscription/usage error:')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
