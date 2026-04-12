import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/logger'

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
    const { friendId } = body

    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 })
    }

    if (friendId === user.id) {
      return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 })
    }

    // Check if friend exists
    const friend = await db.user.findUnique({ where: { id: friendId } })
    if (!friend) {
      return NextResponse.json({ error: 'Friend not found' }, { status: 404 })
    }

    // Check if friend request already exists
    const existingRequest = await db.userFriend.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: friendId },
          { userId: friendId, friendId: user.id },
        ],
      },
    })

    if (existingRequest) {
      return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 })
    }

    // Create friend request
    const friendRequest = await db.userFriend.create({
      data: {
        userId: user.id,
        friendId: friendId,
        status: 'pending',
        requestedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, friendRequest }, { status: 201 })
  } catch (error) {
    logger.error({ err: error }, 'Error adding friend:')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
