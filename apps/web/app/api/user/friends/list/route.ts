import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Get all accepted friend relationships where user is the requester or recipient
    const acceptedFriends = await db.userFriend.findMany({
      where: {
        status: 'accepted',
        OR: [
          { userId: user.id },
          { friendId: user.id }
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        },
        friend: {
          select: { id: true, name: true, avatarUrl: true, email: true }
        }
      }
    })

    // Transform to return the friend's info (not self)
    const friends = acceptedFriends.map(relationship => ({
      id: relationship.id,
      friend: relationship.userId === user.id ? relationship.friend : relationship.user,
      acceptedAt: relationship.acceptedAt
    }))

    return NextResponse.json({ success: true, friends, count: friends.length })
  } catch (error) {
    console.error('Error fetching friend list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
