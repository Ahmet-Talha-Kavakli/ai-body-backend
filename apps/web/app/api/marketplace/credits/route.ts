/**
 * V4.8 Faz D — Kullanıcı Credit Bakiyesi + Geçmişi
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/with-auth'
import { db } from '@/lib/db/client'
import { getUserBalance } from '@/lib/marketplace/credit-ledger'

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  const balance = await getUserBalance(user.id)
  const recent = await db.creditLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      delta: true,
      reason: true,
      balance: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ balance, recent })
})
