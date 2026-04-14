import { useState, useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<string>('undetermined')
  const notificationListener = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    registerForPushNotifications()
    notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
      console.log('Notification received:', n)
    })
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current)
      }
    }
  }, [])

  const registerForPushNotifications = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    setPermission(finalStatus)
    if (finalStatus !== 'granted') return

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    if (!projectId) return

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    setExpoPushToken(token)

    await fetch(`${API_BASE}/api/notifications/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'expo', token }),
    }).catch(() => {})
  }

  const scheduleWaterReminders = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync()
    for (let hour = 8; hour <= 22; hour += 2) {
      await Notifications.scheduleNotificationAsync({
        content: { title: '💧 Su İçmeyi Unutma!', body: 'Günde 8 bardak su içmeyi hedefle.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
      })
    }
  }

  const scheduleMealReminders = async () => {
    const meals = [
      {
        hour: 8,
        minute: 0,
        title: '🌅 Kahvaltı Vakti',
        body: 'Güne enerjik başlamak için kahvaltını yap!',
      },
      {
        hour: 12,
        minute: 30,
        title: '☀️ Öğle Yemeği Vakti',
        body: 'Öğle yemeğini loglamayı unutma.',
      },
      {
        hour: 19,
        minute: 0,
        title: '🌙 Akşam Yemeği Vakti',
        body: 'Akşam yemeğini kaydet ve hedeflerini gör.',
      },
    ]
    for (const meal of meals) {
      await Notifications.scheduleNotificationAsync({
        content: { title: meal.title, body: meal.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: meal.hour,
          minute: meal.minute,
        },
      })
    }
  }

  return { expoPushToken, permission, scheduleWaterReminders, scheduleMealReminders }
}
