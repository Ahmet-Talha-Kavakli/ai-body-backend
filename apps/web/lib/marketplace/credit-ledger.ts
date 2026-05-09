/**
 * V4.8 Faz D — Credit Ledger
 *
 * Kullanıcı kredisini takip eder. Her hareket immutable kayıt.
 * Test fazında çekim yok, in-app harcama.
 *
 * Komisyon: %30 FitAI, %70 yaratıcı
 */

import { db } from '@/lib/db/client'

export const FITAI_COMMISSION_RATE = 0.3
export const STARTING_CREDIT = 500 // Yeni kullanıcıya hediye (test fazı)

export async function getUserBalance(userId: string): Promise<number> {
  const last = await db.creditLedger.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balance: true },
  })
  if (last) return last.balance

  // Yeni kullanıcı — hediye credit
  await db.creditLedger.create({
    data: {
      userId,
      delta: STARTING_CREDIT,
      reason: 'iap_topup',
      balance: STARTING_CREDIT,
    },
  })
  return STARTING_CREDIT
}

export async function spendCredits(
  userId: string,
  amount: number,
  reason: string,
  refs?: { rentalId?: string; listingId?: string }
): Promise<{ ok: true; balance: number } | { ok: false; reason: string; balance: number }> {
  if (amount <= 0) throw new Error('Spend amount must be positive')
  const balance = await getUserBalance(userId)
  if (balance < amount) {
    return { ok: false, reason: 'Yetersiz bakiye', balance }
  }
  const newBalance = balance - amount
  await db.creditLedger.create({
    data: {
      userId,
      delta: -amount,
      reason,
      refRentalId: refs?.rentalId,
      refListingId: refs?.listingId,
      balance: newBalance,
    },
  })
  return { ok: true, balance: newBalance }
}

export async function earnCredits(
  userId: string,
  amount: number,
  reason: string,
  refs?: { rentalId?: string; listingId?: string }
): Promise<{ balance: number }> {
  if (amount <= 0) throw new Error('Earn amount must be positive')
  const balance = await getUserBalance(userId)
  const newBalance = balance + amount
  await db.creditLedger.create({
    data: {
      userId,
      delta: amount,
      reason,
      refRentalId: refs?.rentalId,
      refListingId: refs?.listingId,
      balance: newBalance,
    },
  })
  return { balance: newBalance }
}

/**
 * Kullanıcı yaratıcıya ödeme yapar. %30 komisyon FitAI'ye, %70 yaratıcıya.
 */
export async function processRentalPayment(
  renterId: string,
  ownerId: string,
  totalCost: number,
  refs: { rentalId?: string; listingId?: string }
): Promise<{ ok: true; ownerEarning: number; commission: number } | { ok: false; reason: string }> {
  const commission = Math.round(totalCost * FITAI_COMMISSION_RATE)
  const ownerEarning = totalCost - commission

  const spendResult = await spendCredits(renterId, totalCost, 'rental_payment', refs)
  if (!spendResult.ok) return { ok: false, reason: spendResult.reason }

  await earnCredits(ownerId, ownerEarning, 'rental_earning', refs)

  return { ok: true, ownerEarning, commission }
}
