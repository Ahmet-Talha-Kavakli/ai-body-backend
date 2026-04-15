import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'

const BRAND_MAP: Record<string, { brand: string; model: string }> = {
  google_fit: { brand: 'Google', model: 'Fit' },
  garmin: { brand: 'Garmin', model: 'Connect' },
  fitbit: { brand: 'Fitbit', model: 'Tracker' },
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

async function handleFitbitCallback(
  code: string,
  verifier: string,
  clerkId: string,
  provider: string
) {
  const clientId = process.env.FITBIT_CLIENT_ID!
  const callbackUrl = `${appUrl()}/api/health/devices/oauth/callback`

  // Exchange code for tokens
  const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      redirect_uri: callbackUrl,
      code,
      code_verifier: verifier,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error('Fitbit token exchange failed:', err)
    throw new Error('token_exchange_failed')
  }

  const tokens = await tokenRes.json()
  const { access_token, refresh_token, user_id: fitbitUserId } = tokens

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) throw new Error('user_not_found')

  // Upsert device
  const device = await db.wearableDevice.upsert({
    where: { id: `fitbit-${user.id}` },
    update: {
      isConnected: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      externalUserId: fitbitUserId,
      lastSyncedAt: new Date(),
    },
    create: {
      id: `fitbit-${user.id}`,
      userId: user.id,
      type: 'fitbit',
      brand: 'Fitbit',
      model: 'Tracker',
      isConnected: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      externalUserId: fitbitUserId,
      lastSyncedAt: new Date(),
    },
  })

  // Fetch and store initial data in background (don't await)
  syncFitbitData(access_token, user.id, device.id).catch(console.error)
}

async function syncFitbitData(accessToken: string, userId: string, deviceId: string) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const headers = { Authorization: `Bearer ${accessToken}` }

  const [stepsRes, heartRes, sleepRes] = await Promise.all([
    fetch(`https://api.fitbit.com/1/user/-/activities/steps/date/${weekAgo}/${today}.json`, {
      headers,
    }),
    fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${weekAgo}/${today}.json`, {
      headers,
    }),
    fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${weekAgo}/${today}.json`, { headers }),
  ])

  const [stepsData, heartData, sleepData] = await Promise.all([
    stepsRes.ok ? stepsRes.json() : null,
    heartRes.ok ? heartRes.json() : null,
    sleepRes.ok ? sleepRes.json() : null,
  ])

  const readings: {
    userId: string
    deviceId: string
    type: string
    value: number
    unit: string
    recordedAt: Date
  }[] = []

  // Steps
  if (stepsData?.['activities-steps']) {
    for (const entry of stepsData['activities-steps']) {
      readings.push({
        userId,
        deviceId,
        type: 'steps',
        value: parseInt(entry.value, 10),
        unit: 'steps',
        recordedAt: new Date(entry.dateTime),
      })
    }
  }

  // Heart rate
  if (heartData?.['activities-heart']) {
    for (const entry of heartData['activities-heart']) {
      const rhr = entry.value?.restingHeartRate
      if (rhr) {
        readings.push({
          userId,
          deviceId,
          type: 'heart_rate',
          value: rhr,
          unit: 'bpm',
          recordedAt: new Date(entry.dateTime),
        })
      }
    }
  }

  // Sleep
  if (sleepData?.sleep) {
    for (const entry of sleepData.sleep) {
      readings.push({
        userId,
        deviceId,
        type: 'sleep_minutes',
        value: entry.minutesAsleep,
        unit: 'minutes',
        recordedAt: new Date(entry.startTime),
      })
    }
  }

  if (readings.length > 0) {
    await db.wearableReading.createMany({ data: readings, skipDuplicates: true })
  }

  await db.wearableDevice.update({
    where: { id: deviceId },
    data: { lastSyncedAt: new Date() },
  })
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mock = searchParams.get('mock')
    const provider = searchParams.get('provider') ?? ''
    const state = searchParams.get('state') ?? ''
    const code = searchParams.get('code') ?? ''
    const base = appUrl()

    // Parse state
    let stateData: { clerkId: string; provider: string; verifier?: string } | null = null
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(`${base}/dashboard/health?tab=devices&error=invalid_state`)
    }

    if (!stateData?.clerkId) {
      return NextResponse.redirect(`${base}/dashboard/health?tab=devices&error=invalid_state`)
    }

    // Mock mode
    if (mock) {
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
      return NextResponse.redirect(`${base}/dashboard/health?tab=devices&connected=${provider}`)
    }

    // Real OAuth callback
    if (!code) {
      return NextResponse.redirect(`${base}/dashboard/health?tab=devices&error=no_code`)
    }

    if (stateData.provider === 'fitbit' && stateData.verifier) {
      await handleFitbitCallback(code, stateData.verifier, stateData.clerkId, provider)
      return NextResponse.redirect(`${base}/dashboard/health?tab=devices&connected=fitbit`)
    }

    // Other providers — redirect for now
    return NextResponse.redirect(`${base}/dashboard/health?tab=devices`)
  } catch (e) {
    console.error('OAuth callback error:', e)
    return NextResponse.redirect(`${appUrl()}/dashboard/health?tab=devices&error=callback_failed`)
  }
}
