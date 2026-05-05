/**
 * withAuth — eliminates the repeated auth boilerplate in every API route.
 * Supports both:
 *   - Web (session cookie via Clerk auth())
 *   - Mobile (Bearer token via Authorization header)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth, verifyToken } from '@clerk/nextjs/server'
import { db } from '@/lib/db/client'
import type { User } from '@prisma/client'

type RouteContext = {
  params?: Record<string, string | string[]> | Promise<Record<string, string | string[]>>
}

type AuthenticatedHandler<C extends RouteContext = RouteContext> = (
  req: NextRequest,
  context: { user: User } & C
) => Promise<NextResponse> | NextResponse

async function resolveClerkId(req: NextRequest): Promise<string | null> {
  // 1. Try Bearer token from mobile
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim()
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
        // Mobile JWT'leri kısa ömürlü (60sn). Refresh gecikmesi için 5 dk tolerans.
        clockSkewInMs: 5 * 60 * 1000,
      })
      return payload.sub ?? null
    } catch (e) {
      console.error('[withAuth] verifyToken error:', e)
      return null
    }
  }

  // 2. Fall back to session cookie (web)
  const { userId } = await auth()
  return userId
}

export function withAuth<C extends RouteContext = RouteContext>(handler: AuthenticatedHandler<C>) {
  return async (req: NextRequest, ctx: any): Promise<NextResponse> => {
    const clerkId = await resolveClerkId(req)

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { clerkId } })

    if (!user) {
      console.error(`[withAuth] clerkId=${clerkId} token verified but no DB user found`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req, { ...ctx, user })
  }
}

export function withAuthAndSubscription<C extends RouteContext = RouteContext>(
  handler: AuthenticatedHandler<C>
) {
  return async (req: NextRequest, ctx: C): Promise<NextResponse> => {
    const clerkId = await resolveClerkId(req)

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { clerkId },
      include: { subscription: true },
    })

    if (!user) {
      console.error(`[withAuth] clerkId=${clerkId} token verified but no DB user found`)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return handler(req, { ...ctx, user: user as User })
  }
}
