import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()

    if (body.type === 'web') {
      await db.notificationPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          webPushEnabled: true,
          webPushEndpoint: body.endpoint,
          webPushAuth: body.auth,
          webPushP256dh: body.p256dh,
        },
        update: {
          webPushEnabled: true,
          webPushEndpoint: body.endpoint,
          webPushAuth: body.auth,
          webPushP256dh: body.p256dh,
        },
      })
    } else if (body.type === 'expo') {
      await db.notificationPreference.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          mobilePushEnabled: true,
          expoPushToken: body.token,
        },
        update: {
          mobilePushEnabled: true,
          expoPushToken: body.token,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
