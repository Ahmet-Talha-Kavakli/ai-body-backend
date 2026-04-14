import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const OAUTH_CONFIGS: Record<string, { authUrl: string; clientId: string; scope: string }> = {
  google_fit: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    clientId: process.env.GOOGLE_FIT_CLIENT_ID ?? '',
    scope:
      'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.heart_rate.read',
  },
  garmin: {
    authUrl: 'https://connect.garmin.com/oauthConfirm',
    clientId: process.env.GARMIN_CONSUMER_KEY ?? '',
    scope: 'ACTIVITY_EXPORT',
  },
  fitbit: {
    authUrl: 'https://www.fitbit.com/oauth2/authorize',
    clientId: process.env.FITBIT_CLIENT_ID ?? '',
    scope: 'activity heartrate sleep profile',
  },
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { provider } = await req.json()
    const config = OAUTH_CONFIGS[provider]
    if (!config) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

    const state = Buffer.from(JSON.stringify({ clerkId, provider })).toString('base64')

    if (!config.clientId) {
      // Dev mode: mock connect
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/health/devices/oauth/callback?provider=${provider}&mock=true&state=${state}`
      return NextResponse.json({ redirectUrl: callbackUrl })
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/health/devices/oauth/callback`
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: callbackUrl,
      scope: config.scope,
      response_type: 'code',
      state,
    })

    return NextResponse.json({ redirectUrl: `${config.authUrl}?${params}` })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
