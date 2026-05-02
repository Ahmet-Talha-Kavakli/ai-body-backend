import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { analyzeBloodWork } from '@/lib/health/blood-work-parser'
import type { BloodWorkResult } from '@/lib/health/blood-work-parser'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const contentType = req.headers.get('content-type') ?? ''

  try {
    let results: BloodWorkResult

    if (contentType.includes('application/json')) {
      const body = await req.json()
      results = { ...body, testDate: body.testDate ? new Date(body.testDate) : new Date() }
    } else {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 })
    }

    const analysis = analyzeBloodWork(results)

    const record = await prisma.bloodWorkRecord.create({
      data: {
        userId: user.id,
        results: results as any,
        analysis: analysis as any,
        uploadedAt: results.testDate ?? new Date(),
      },
    })

    return NextResponse.json({ id: record.id, results, analysis })
  } catch {
    return NextResponse.json({ error: 'Failed to save blood work' }, { status: 500 })
  }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const records = await prisma.bloodWorkRecord.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ records })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await prisma.bloodWorkRecord.deleteMany({ where: { id, userId: user.id } })
  return NextResponse.json({ ok: true })
}
