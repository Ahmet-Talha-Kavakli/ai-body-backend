/**
 * withAuth — eliminates the repeated auth boilerplate in every API route.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { user }) => {
 *     return NextResponse.json({ id: user.id })
 *   })
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import type { User } from '@prisma/client'

type RouteContext = {
  params?: Record<string, string | string[]> | Promise<Record<string, string | string[]>>
}

type AuthenticatedHandler<C extends RouteContext = RouteContext> = (
  req: NextRequest,
  context: { user: User } & C
) => Promise<NextResponse> | NextResponse

/**
 * Wraps a route handler with auth + user lookup.
 * Returns 401 if not authenticated, 404 if user not in DB.
 */
export function withAuth<C extends RouteContext = RouteContext>(handler: AuthenticatedHandler<C>) {
  return async (req: NextRequest, ctx: any): Promise<NextResponse> => {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return handler(req, { ...ctx, user })
  }
}

/**
 * withAuth variant that also includes the subscription in the user query.
 */
export function withAuthAndSubscription<C extends RouteContext = RouteContext>(
  handler: AuthenticatedHandler<C>
) {
  return async (req: NextRequest, ctx: C): Promise<NextResponse> => {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return handler(req, { ...ctx, user: user as User })
  }
}
