import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

const BRAND_MAP: Record<string, { brand: string; model: string }> = {
  google_fit: { brand: 'Google', model: 'Fit' },
  garmin: { brand: 'Garmin', model: 'Connect' },
  fitbit: { brand: 'Fitbit', model: 'Sense 2' },
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mock = searchParams.get('mock')
    const provider = searchParams.get('provider') ?? ''
    const state = searchParams.get('state') ?? ''
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

    if (mock && state) {
      let stateData: { clerkId: string; provider: string } | null = null
      try {
        stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      } catch {
        return NextResponse.redirect(`${appUrl}/dashboard/health?tab=devices&error=invalid_state`)
      }

      if (stateData?.clerkId) {
        const user = await db.user.findUnique({ where: { clerkId: stateData.clerkId } })
        if (user) {
          const info = BRAND_MAP[provider] ?? { brand: provider, model: '' }
          const deviceId = `mock-${user.id}-${provider}`
          await db.wearableDevice.upsert({
            where: { id: deviceId },
            update: { isConnected: true, lastSyncedAt: new Date() },
            create: {
              id: deviceId,
              userId: user.id,
              type: provider,
              brand: info.brand,
              model: info.model,
              isConnected: true,
              lastSyncedAt: new Date(),
            },
          })
        }
      }
      return NextResponse.redirect(`${appUrl}/dashboard/health?tab=devices&connected=${provider}`)
    }

    // Real OAuth token exchange would happen here
    return NextResponse.redirect(`${appUrl}/dashboard/health?tab=devices`)
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/dashboard/health?tab=devices&error=callback_failed`
    )
  }
}
