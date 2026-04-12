import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/logger'

const ACTIVITY_TYPES = ['workout_completed', 'pr_achieved', 'streak_milestone'] as const
type ActivityType = (typeof ACTIVITY_TYPES)[number]

const VISIBILITY_TYPES = ['private', 'friends_only', 'public'] as const
type VisibilityType = (typeof VISIBILITY_TYPES)[number]

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const { activityType, description, metadata, visibility } = body

    if (!activityType || !description) {
      return NextResponse.json(
        { error: 'activityType and description are required' },
        { status: 400 }
      )
    }

    // Validate activity type
    if (!ACTIVITY_TYPES.includes(activityType)) {
      return NextResponse.json(
        { error: `Invalid activityType. Must be one of: ${ACTIVITY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate visibility
    const activityVisibility: VisibilityType = visibility || 'friends_only'
    if (!VISIBILITY_TYPES.includes(activityVisibility)) {
      return NextResponse.json(
        { error: `Invalid visibility. Must be one of: ${VISIBILITY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Create activity
    const activity = await db.userActivity.create({
      data: {
        userId: user.id,
        activityType,
        description,
        metadata: metadata || {},
        visibility: activityVisibility,
        createdAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, activity }, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error logging activity:')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
