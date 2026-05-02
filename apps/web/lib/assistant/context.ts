/**
 * Mesaj öncesi tüm context'i toplama: profile, facts, people, events, environment.
 */

import { db } from '@/lib/db/client'
import { getWeatherSummary, getRecentEarthquake } from './external'

export async function loadAssistantContext(userId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    profile,
    user,
    facts,
    people,
    recentEvents,
    environment,
    lastConversation,
    permissions,
    recentMoods,
  ] = await Promise.all([
    db.assistantProfile.findUnique({
      where: { userId },
      select: {
        name: true,
        formality: true,
        humor: true,
        directness: true,
        supportStyle: true,
        msgLengthPref: true,
        emojiPref: true,
        emotionalOpenness: true,
        needsAdvice: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    db.assistantMemoryFact.findMany({
      // V2 (Faz J): Sadece aktif (supersede edilmemiş, arşivlenmemiş) facts
      where: { userId, archived: false, supersededById: null },
      orderBy: [{ category: 'asc' }, { lastConfirmedAt: 'desc' }],
      take: 80,
      select: {
        id: true,
        category: true,
        content: true,
        confidence: true,
        lastConfirmedAt: true,
      },
    }),
    db.person.findMany({
      where: { userId, archived: false },
      orderBy: [{ importance: 'desc' }, { lastMentionedAt: 'desc' }],
      take: 20,
      select: {
        name: true,
        relationship: true,
        healthConditions: true,
        importance: true,
        isEmergencyContact: true,
      },
    }),
    db.lifeEvent.findMany({
      where: {
        userId,
        OR: [{ date: { gte: thirtyDaysAgo } }, { resolved: false }],
      },
      orderBy: { date: 'desc' },
      take: 20,
      select: { type: true, title: true, date: true, resolved: true },
    }),
    db.environmentContext.findUnique({
      where: { userId },
      select: { city: true, latitude: true, longitude: true, alertsEnabled: true },
    }),
    // V2 (Faz L3): son sohbet bağlamı — selamlama için
    db.assistantConversation.findFirst({
      where: { userId, archived: false },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { role: true, content: true, createdAt: true },
        },
      },
    }),
    db.assistantPermission.findMany({
      where: { userId, status: 'granted' },
      select: { capability: true },
    }),
    // V2 (Faz L3): son 7 günün mood'u — açılışta dikkate alınır
    db.moodLog.findMany({
      where: {
        userId,
        loggedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { loggedAt: 'desc' },
      take: 7,
      select: { mood: true, moodScore: true, note: true, loggedAt: true },
    }),
  ])

  // Çevre verisi varsa otomatik hava + deprem çek (paralel, cache'li)
  let weatherSummary: string | null = null
  let earthquakeAlert: string | null = null
  if (environment?.latitude && environment?.longitude && environment.alertsEnabled !== false) {
    const [weather, eq] = await Promise.all([
      getWeatherSummary(environment.latitude, environment.longitude).catch(() => null),
      getRecentEarthquake(environment.latitude, environment.longitude).catch(() => null),
    ])
    if (weather) {
      weatherSummary = `${weather.temperatureC}°C, ${weather.weatherSummary}${weather.humidity ? ', %' + weather.humidity + ' nem' : ''}`
    }
    if (eq) {
      const hoursAgo = Math.round((Date.now() - eq.time) / (60 * 60 * 1000))
      earthquakeAlert = `Son 24 saatte ${eq.distanceKm}km uzakta ${eq.magnitude} büyüklüğünde deprem (${hoursAgo}sa önce, ${eq.place})`
    }
  }

  // V2 (Faz L3): Selamlama bağlamı — son sohbetten bu yana ne kadar süre geçti, mood ortalaması ne
  let greetingContext: {
    minutesSinceLast: number | null
    lastTitle: string | null
    lastMessageRole: string | null
    avgMoodScore: number | null
    moodCount: number
  } | null = null
  if (lastConversation) {
    const minutes = Math.round((Date.now() - lastConversation.updatedAt.getTime()) / 60000)
    const lastMsg = lastConversation.messages[0]
    const moodScores = recentMoods
      .map((m) => m.moodScore)
      .filter((s): s is number => typeof s === 'number')
    const avg = moodScores.length ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length : null
    greetingContext = {
      minutesSinceLast: minutes,
      lastTitle: lastConversation.title,
      lastMessageRole: lastMsg?.role ?? null,
      avgMoodScore: avg,
      moodCount: moodScores.length,
    }
  }

  return {
    profile,
    user: user ?? { name: null },
    facts,
    people,
    recentEvents,
    environment: environment ? { city: environment.city, weatherSummary, earthquakeAlert } : null,
    greetingContext,
    grantedCapabilities: permissions.map((p) => p.capability),
  }
}
