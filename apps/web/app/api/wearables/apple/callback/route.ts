import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAppleHealthClient } from '@/lib/wearables/apple-health'
import { prisma } from '@/lib/db/client'
import { encryptToken } from '@/lib/crypto/token-encryption'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { code, state } = body

    // Verify state
    const storedState = req.cookies.get('apple_oauth_state')?.value
    if (storedState !== state) {
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 })
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wearables/apple/callback`
    const client = createAppleHealthClient()

    // Exchange code for token
    const { accessToken, refreshToken, expiresIn } = await client.exchangeCodeForToken(
      code,
      redirectUri
    )

    const tokenExpiry = new Date(Date.now() + expiresIn * 1000)

    // Encrypt tokens before storing in DB
    const encryptedAccessToken = encryptToken(accessToken)
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null

    // Upsert wearable record
    const wearable = await prisma.wearable.upsert({
      where: {
        userId_type: {
          userId,
          type: 'APPLE_HEALTH',
        },
      },
      create: {
        userId,
        type: 'APPLE_HEALTH',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        isActive: true,
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Apple Health connected successfully',
        wearable: {
          id: wearable.id,
          type: wearable.type,
          isActive: wearable.isActive,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Apple Callback]', error)
    return NextResponse.json({ error: 'Failed to connect Apple Health' }, { status: 500 })
  }
}
