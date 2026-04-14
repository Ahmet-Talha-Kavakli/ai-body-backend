import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'

const ALLOWED_TYPES = ['steps', 'heart_rate', 'sleep_minutes', 'spo2', 'hrv', 'calories_burned']
const UNITS: Record<string, string> = {
  steps: 'count',
  heart_rate: 'bpm',
  sleep_minutes: 'min',
  spo2: '%',
  hrv: 'ms',
  calories_burned: 'kcal',
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { type, value } = await req.json()
    if (!ALLOWED_TYPES.includes(type) || typeof value !== 'number' || value < 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    let device = await db.wearableDevice.findFirst({
      where: { userId: user.id, type: 'manual' },
    })
    if (!device) {
      device = await db.wearableDevice.create({
        data: {
          userId: user.id,
          type: 'manual',
          brand: 'Manuel',
          model: 'Giriş',
          isConnected: true,
        },
      })
    }

    const reading = await db.wearableReading.create({
      data: {
        deviceId: device.id,
        userId: user.id,
        type,
        value,
        unit: UNITS[type],
        recordedAt: new Date(),
      },
    })
    return NextResponse.json(reading)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
