/**
 * Çevre tool'ları — hava, deprem, lokasyon.
 * Faz 4'te API entegrasyonu eklenecek (Open-Meteo, USGS).
 * Şimdilik DB'ye sorar veya fallback döner.
 */

import { db } from '@/lib/db/client'
import { ToolDefinition, ToolExecutor, ToolResult } from './types'

export const environmentToolDefs: ToolDefinition[] = [
  {
    name: 'set_user_location',
    category: 'environment',
    description:
      'Kullanıcının yaşadığı şehri ve koordinatlarını günceller (hava + deprem uyarıları için).',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        country: { type: 'string', default: 'TR' },
        latitude: { type: 'number' },
        longitude: { type: 'number' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_environment_context',
    category: 'environment',
    description: 'Kullanıcının çevre bilgisini (şehir, ülke, alarm tercihi) döner.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'get_weather_today',
    category: 'environment',
    description:
      'Kullanıcının şehrinde bugünün hava durumunu döner (sıcaklık, yağmur, hava kalitesi).',
    parameters: { type: 'object', properties: {} },
  },
]

export const environmentExecutors: Record<string, ToolExecutor> = {
  set_user_location: {
    name: 'set_user_location',
    execute: async ({ userId, params }) => {
      const p = params as { city: string; country?: string; latitude?: number; longitude?: number }
      let lat = p.latitude
      let lon = p.longitude

      // Koordinat yoksa Open-Meteo geocoding ile şehir adından çevir (ücretsiz, key gerekmez)
      if (!lat || !lon) {
        try {
          const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(p.city)}&count=1&language=tr&format=json`
          const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
          if (res.ok) {
            const data = await res.json()
            const first = data.results?.[0]
            if (first) {
              lat = first.latitude
              lon = first.longitude
            }
          }
        } catch {}
      }

      const env = await db.environmentContext.upsert({
        where: { userId },
        update: {
          city: p.city,
          country: p.country,
          latitude: lat,
          longitude: lon,
        },
        create: {
          userId,
          city: p.city,
          country: p.country ?? 'TR',
          latitude: lat,
          longitude: lon,
        },
      })
      return {
        ok: true,
        data: env,
        display: {
          title: 'Konum güncellendi',
          subtitle: lat && lon ? `${p.city} • Hava verisi aktif` : p.city,
          icon: 'location.fill',
          color: '#5E5CE6',
        },
      } satisfies ToolResult
    },
  },
  get_environment_context: {
    name: 'get_environment_context',
    execute: async ({ userId }) => {
      const env = await db.environmentContext.findUnique({ where: { userId } })
      return { ok: true, data: env } satisfies ToolResult
    },
  },
  get_weather_today: {
    name: 'get_weather_today',
    execute: async ({ userId }) => {
      const env = await db.environmentContext.findUnique({ where: { userId } })
      if (!env?.latitude || !env?.longitude) {
        return {
          ok: false,
          error: 'no_location',
          data: {
            message:
              "Hava durumu için önce konum bilgini güncellemen lazım. set_user_location tool'unu kullanabilirsin.",
          },
        } satisfies ToolResult
      }
      // Open-Meteo (key gerekmez, public)
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${env.latitude}&longitude=${env.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
        if (!res.ok) {
          return { ok: false, error: 'weather_api_failed' } satisfies ToolResult
        }
        const data = await res.json()
        const c = data.current ?? {}
        return {
          ok: true,
          data: {
            city: env.city,
            temperatureC: c.temperature_2m,
            humidity: c.relative_humidity_2m,
            precipitation: c.precipitation,
            windKmh: c.wind_speed_10m,
            weatherCode: c.weather_code,
            weatherSummary: weatherSummary(c.weather_code),
          },
        } satisfies ToolResult
      } catch (e) {
        return { ok: false, error: 'weather_fetch_error' } satisfies ToolResult
      }
    },
  },
}

function weatherSummary(code: number): string {
  // WMO weather codes
  if (code === 0) return 'Açık'
  if ([1, 2, 3].includes(code)) return 'Az bulutlu - Bulutlu'
  if ([45, 48].includes(code)) return 'Sisli'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Çisenti'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Yağmurlu'
  if ([71, 73, 75, 77].includes(code)) return 'Karlı'
  if ([80, 81, 82].includes(code)) return 'Sağanak'
  if ([95, 96, 99].includes(code)) return 'Gök gürültülü fırtına'
  return 'Belirsiz'
}
