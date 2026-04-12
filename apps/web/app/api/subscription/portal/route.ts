import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'

/**
 * POST /api/subscription/portal
 * Creates a Stripe billing portal session for the user
 */
export async function POST() {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })

    if (!user || !user.subscription?.stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error({ err: error }, 'POST /api/subscription/portal error:')
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
