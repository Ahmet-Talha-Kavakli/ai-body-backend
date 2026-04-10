import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId: clerkId } = auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
    const { friendRequestId } = body

    if (!friendRequestId) {
      return NextResponse.json({ error: 'friendRequestId is required' }, { status: 400 })
    }

    // Find the friend request
    const friendRequest = await db.userFriend.findUnique({
      where: { id: friendRequestId }
    })

    if (!friendRequest) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 })
    }

    // Verify the current user is the recipient of the request
    if (friendRequest.friendId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to accept this request' }, { status: 403 })
    }

    // Check if already accepted
    if (friendRequest.status === 'accepted') {
      return NextResponse.json({ error: 'Friend request already accepted' }, { status: 400 })
    }

    // Update the request to accepted
    const updatedRequest = await db.userFriend.update({
      where: { id: friendRequestId },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, friendRequest: updatedRequest })
  } catch (error) {
    console.error('Error accepting friend request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
