import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

async function refreshFitbitToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.FITBIT_CLIENT_ID
  if (!clientId) return null

  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()

  return data.access_token ?? null
}

async function syncFitbitDevice(deviceId: string, accessToken: string, userId: string) {
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

  if (stepsData?.['activities-steps']) {
    for (const entry of stepsData['activities-steps']) {
      const val = parseInt(entry.value, 10)
      if (val > 0)
        readings.push({
          userId,
          deviceId,
          type: 'steps',
          value: val,
          unit: 'steps',
          recordedAt: new Date(entry.dateTime),
        })
    }
  }

  if (heartData?.['activities-heart']) {
    for (const entry of heartData['activities-heart']) {
      const rhr = entry.value?.restingHeartRate
      if (rhr)
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

  if (sleepData?.sleep) {
    for (const entry of sleepData.sleep) {
      if (entry.minutesAsleep > 0)
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

  await db.wearableDevice.update({ where: { id: deviceId }, data: { lastSyncedAt: new Date() } })

  return readings.length
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { deviceId } = await req.json()

    const device = await db.wearableDevice.findFirst({
      where: { id: deviceId, userId: user.id },
    })

    if (!device || !device.accessToken) {
      return NextResponse.json({ error: 'Device not found or no token' }, { status: 404 })
    }

    if (device.type === 'fitbit') {
      let token = device.accessToken

      const count = await syncFitbitDevice(device.id, token, user.id).catch(async () => {
        // Try refresh token
        if (device.refreshToken) {
          const newToken = await refreshFitbitToken(device.refreshToken)
          if (newToken) {
            await db.wearableDevice.update({
              where: { id: device.id },
              data: { accessToken: newToken },
            })
            token = newToken
            return syncFitbitDevice(device.id, token, user.id)
          }
        }
        return 0
      })

      return NextResponse.json({ success: true, newReadings: count })
    }

    return NextResponse.json({ error: 'Sync not supported for this device type' }, { status: 400 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
