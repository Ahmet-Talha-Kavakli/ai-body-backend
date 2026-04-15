import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import crypto from 'crypto'

function base64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function generatePKCE() {
  const verifier = base64url(crypto.randomBytes(32))
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { provider } = await req.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const callbackUrl = `${appUrl}/api/health/devices/oauth/callback`

    if (provider === 'fitbit') {
      const clientId = process.env.FITBIT_CLIENT_ID ?? ''

      if (!clientId) {
        // Mock mode
        const state = Buffer.from(JSON.stringify({ clerkId, provider })).toString('base64')
        return NextResponse.json({
          redirectUrl: `${callbackUrl}?provider=${provider}&mock=true&state=${state}`,
        })
      }

      const { verifier, challenge } = generatePKCE()
      const state = Buffer.from(JSON.stringify({ clerkId, provider, verifier })).toString('base64')

      const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        scope: 'activity heartrate sleep profile weight oxygen_saturation',
        redirect_uri: callbackUrl,
        state,
      })

      return NextResponse.json({ redirectUrl: `https://www.fitbit.com/oauth2/authorize?${params}` })
    }

    if (provider === 'google_fit') {
      const clientId = process.env.GOOGLE_FIT_CLIENT_ID ?? ''

      if (!clientId) {
        const state = Buffer.from(JSON.stringify({ clerkId, provider })).toString('base64')
        return NextResponse.json({
          redirectUrl: `${callbackUrl}?provider=${provider}&mock=true&state=${state}`,
        })
      }

      const state = Buffer.from(JSON.stringify({ clerkId, provider })).toString('base64')
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.heart_rate.read',
        response_type: 'code',
        access_type: 'offline',
        state,
      })

      return NextResponse.json({
        redirectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      })
    }

    if (provider === 'garmin') {
      // Garmin uses OAuth 1.0 — mock only for now
      const state = Buffer.from(JSON.stringify({ clerkId, provider })).toString('base64')
      return NextResponse.json({
        redirectUrl: `${callbackUrl}?provider=${provider}&mock=true&state=${state}`,
      })
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
