'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { NotificationType } from '@prisma/client'

export interface InAppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

interface UseInAppNotificationsResult {
  notifications: InAppNotification[]
  unreadCount: number
  loading: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  refresh: () => void
}

export function useInAppNotifications(): UseInAppNotificationsResult {
  const [notifications, setNotifications] = useState<InAppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      if (!isMounted.current) return
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // silent
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    fetchNotifications()

    const interval = setInterval(fetchNotifications, 30_000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      isMounted.current = false
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))

    await fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)

    await fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {})
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refresh: fetchNotifications,
  }
}
