import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateHealthInsight } from '@/lib/health/generateHealthInsight'

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ctx = await req.json()
    const insight = await generateHealthInsight(ctx)
    return NextResponse.json({ insight })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
