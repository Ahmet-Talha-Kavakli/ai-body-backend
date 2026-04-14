'use client'

import { useState, useEffect } from 'react'

interface UseNotificationsResult {
  supported: boolean
  permission: NotificationPermission | 'unsupported'
  subscribe: () => Promise<void>
}

export function useNotifications(): UseNotificationsResult {
  const supported =
    typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    supported ? Notification.permission : 'unsupported'
  )

  useEffect(() => {
    if (!supported) return
    setPermission(Notification.permission)
  }, [supported])

  const subscribe = async () => {
    if (!supported) return
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return

    const reg = await navigator.serviceWorker.register('/sw.js')
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    const json = sub.toJSON()
    await fetch('/api/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'web',
        endpoint: json.endpoint,
        auth: json.keys?.auth,
        p256dh: json.keys?.p256dh,
      }),
    })
  }

  return { supported, permission, subscribe }
}
