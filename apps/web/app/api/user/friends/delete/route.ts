import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  try {
    const { friendId } = await request.json()

    if (!friendId) {
      return NextResponse.json({ error: 'friendId is required' }, { status: 400 })
    }

    // Delete both directions
    await db.userFriend.deleteMany({
      where: {
        OR: [
          { userId: user.id, friendId },
          { userId: friendId, friendId: user.id },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting friend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
