import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get all friends of current user (accepted relationships)
    const friendships = await db.userFriend.findMany({
      where: {
        status: 'accepted',
        OR: [
          { userId: user.id },
          { friendId: user.id }
        ]
      }
    })

    // Extract friend IDs
    const friendIds = friendships.map(f => f.userId === user.id ? f.friendId : f.userId)

    // Get activities from friends (that are not private)
    const activities = await db.userActivity.findMany({
      where: {
        userId: {
          in: friendIds
        },
        visibility: {
          in: ['friends_only', 'public']
        }
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 activities
    })

    return NextResponse.json({ success: true, activities, count: activities.length })
  } catch (error) {
    console.error('Error fetching activity feed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
