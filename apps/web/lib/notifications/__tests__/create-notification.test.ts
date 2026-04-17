import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
vi.mock('@/lib/db/client', () => ({
  db: {
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-1' }),
    },
    notificationPreference: {
      findUnique: vi.fn(),
    },
  },
}))

// Mock web-push
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}))

import { createNotification } from '../create-notification'
import { db } from '@/lib/db/client'
import webPush from 'web-push'

describe('createNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes notification to DB', async () => {
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue(null)

    await createNotification('user-1', {
      type: 'achievement',
      title: 'Yeni Başarım!',
      body: 'İlk antrenmanını tamamladın.',
      link: '/dashboard/progress',
    })

    expect(db.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'achievement',
        title: 'Yeni Başarım!',
        body: 'İlk antrenmanını tamamladın.',
        link: '/dashboard/progress',
        read: false,
      },
    })
  })

  it('does not send push when preference toggle is off', async () => {
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      achievementAlert: false,
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)

    await createNotification('user-1', {
      type: 'achievement',
      title: 'Test',
      body: 'Body',
    })

    expect(webPush.sendNotification).not.toHaveBeenCalled()
  })

  it('sends push when toggle is on and webPushEnabled', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub-key'
    process.env.VAPID_PRIVATE_KEY = 'priv-key'
    process.env.VAPID_EMAIL = 'mailto:test@example.com'

    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      achievementAlert: true,
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)

    await createNotification('user-1', {
      type: 'achievement',
      title: 'Test',
      body: 'Body',
    })

    expect(webPush.sendNotification).toHaveBeenCalled()
  })

  it('sends system notifications regardless of preference toggle', async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'pub-key'
    process.env.VAPID_PRIVATE_KEY = 'priv-key'

    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)

    await createNotification('user-1', {
      type: 'system',
      title: 'Sistem mesajı',
      body: 'Yeni özellik!',
    })

    expect(db.notification.create).toHaveBeenCalled()
    expect(webPush.sendNotification).toHaveBeenCalled()
  })

  it('still writes to DB even if push throws', async () => {
    vi.mocked(db.notificationPreference.findUnique).mockResolvedValue({
      achievementAlert: true,
      webPushEnabled: true,
      webPushEndpoint: 'https://fcm.example.com/sub',
      webPushAuth: 'auth-key',
      webPushP256dh: 'p256dh-key',
    } as any)
    vi.mocked(webPush.sendNotification).mockRejectedValue(new Error('Push failed'))

    // Should NOT throw
    await expect(
      createNotification('user-1', { type: 'achievement', title: 'T', body: 'B' })
    ).resolves.not.toThrow()

    expect(db.notification.create).toHaveBeenCalled()
  })
})
