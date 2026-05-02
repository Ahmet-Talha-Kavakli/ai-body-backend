/**
 * Expo Push Notification servisi.
 * https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { db } from '@/lib/db/client'

export interface PushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
}

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default'
  badge?: number
  channelId?: string
}

/**
 * Belirli bir kullanıcıya push gönder.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ ok: boolean; reason?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      expoPushToken: true,
      notificationsEnabled: true,
      quietHoursStart: true,
      quietHoursEnd: true,
    },
  })

  if (!user?.expoPushToken) return { ok: false, reason: 'no_token' }
  if (user.notificationsEnabled === false) return { ok: false, reason: 'disabled' }

  // Quiet hours kontrolü
  if (user.quietHoursStart != null && user.quietHoursEnd != null) {
    const now = new Date().getHours()
    const start = user.quietHoursStart
    const end = user.quietHoursEnd
    let inQuiet = false
    if (start < end) {
      inQuiet = now >= start && now < end
    } else {
      // Gece yarısı geçişi (örn 22→8)
      inQuiet = now >= start || now < end
    }
    if (inQuiet) return { ok: false, reason: 'quiet_hours' }
  }

  return await sendExpoPush({
    to: user.expoPushToken,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    sound: 'default',
    channelId: 'default',
  })
}

async function sendExpoPush(message: ExpoPushMessage): Promise<{ ok: boolean; reason?: string }> {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
    if (!res.ok) {
      console.error('[push] expo http', res.status)
      return { ok: false, reason: `http_${res.status}` }
    }
    const data = await res.json()
    if (data.data?.status === 'error') {
      console.error('[push] expo error', data.data)
      return { ok: false, reason: data.data.message ?? 'expo_error' }
    }
    return { ok: true }
  } catch (e) {
    console.error('[push] fetch', e)
    return { ok: false, reason: 'fetch_error' }
  }
}
