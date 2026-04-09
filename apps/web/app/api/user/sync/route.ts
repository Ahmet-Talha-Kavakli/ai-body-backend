import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clerkUser = await currentUser()
    if (!clerkUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const user = await db.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'Kullanıcı',
        avatarUrl: clerkUser.imageUrl,
      },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'Kullanıcı',
        avatarUrl: clerkUser.imageUrl,
      },
      include: { healthProfile: true },
    })

    return NextResponse.json({
      user,
      onboardingCompleted: !!user.healthProfile,
    })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { healthProfile: true, subscription: true },
    })

    return NextResponse.json({
      user,
      onboardingCompleted: !!user?.healthProfile,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
