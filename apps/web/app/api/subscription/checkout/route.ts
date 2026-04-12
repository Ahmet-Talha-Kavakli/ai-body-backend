import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { stripe } from '@/lib/stripe/client'
import { logger } from '@/lib/logger'

/**
 * POST /api/subscription/checkout
 * Creates a Stripe checkout session for the given plan
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()
    if (!plan || !['basic', 'standard', 'pro'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    let customerId = user.subscription?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      // Save customer ID to subscription
      if (user.subscription) {
        await db.subscription.update({
          where: { userId: user.id },
          data: { stripeCustomerId: customerId },
        })
      } else {
        await db.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            tier: 'free',
          },
        })
      }
    }

    // Get price ID from environment
    const priceIdMap = {
      basic: process.env.STRIPE_BASIC_PRICE_ID,
      standard: process.env.STRIPE_STANDARD_PRICE_ID,
      pro: process.env.STRIPE_PRO_PRICE_ID,
    }

    const priceId = priceIdMap[plan as keyof typeof priceIdMap]
    if (!priceId) {
      return NextResponse.json(
        { error: `Price ID not configured for plan ${plan}` },
        { status: 500 }
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?checkout=cancel`,
      metadata: {
        userId: user.id,
        plan,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    logger.error({ err: error }, 'POST /api/subscription/checkout error:')
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
