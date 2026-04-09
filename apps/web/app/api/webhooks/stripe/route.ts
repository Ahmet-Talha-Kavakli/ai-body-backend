import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/client'
import { db } from '@/lib/db/client'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = (await headers()).get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (userId && plan) {
          // Update subscription
          await db.subscription.update({
            where: { userId },
            data: {
              stripeSubscriptionId: session.subscription,
              tier: plan,
              status: 'active',
              currentPeriodEnd: new Date(session.expires_at * 1000),
              monthlySessionsUsed: 0,
              aiProgramsUsed: 0,
              aiMealsUsed: 0,
              aiCoachUsed: 0,
              usageResetAt: new Date(),
            },
          })

          // Update User tier
          await db.user.update({
            where: { id: userId },
            data: { subscriptionTier: plan },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const sub = await db.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        })

        if (sub) {
          const status = subscription.status === 'active' ? 'active' : 'past_due'
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const sub = await db.subscription.findUnique({
          where: { stripeSubscriptionId: subscription.id },
        })

        if (sub) {
          // Downgrade to free
          await db.subscription.update({
            where: { id: sub.id },
            data: {
              tier: 'free',
              status: 'canceled',
              stripeSubscriptionId: null,
              monthlySessionsUsed: 0,
              aiProgramsUsed: 0,
              aiMealsUsed: 0,
              aiCoachUsed: 0,
            },
          })

          await db.user.update({
            where: { id: sub.userId },
            data: { subscriptionTier: 'free' },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const sub = await db.subscription.findUnique({
          where: { stripeCustomerId: invoice.customer },
        })

        if (sub) {
          await db.subscription.update({
            where: { id: sub.id },
            data: { status: 'past_due' },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    )
  }
}
