import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const { activityType, description, metadata, visibility } = body

    if (!activityType || !description) {
      return NextResponse.json(
        { error: 'activityType and description are required' },
        { status: 400 }
      )
    }

    // Validate activity type
    const validActivityTypes = ['workout_completed', 'pr_achieved', 'streak_milestone']
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json(
        { error: `Invalid activityType. Must be one of: ${validActivityTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate visibility
    const validVisibilities = ['private', 'friends_only', 'public']
    const activityVisibility = visibility || 'friends_only'
    if (!validVisibilities.includes(activityVisibility)) {
      return NextResponse.json(
        { error: `Invalid visibility. Must be one of: ${validVisibilities.join(', ')}` },
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
        createdAt: new Date()
      }
    })

    return NextResponse.json({ success: true, activity }, { status: 201 })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
