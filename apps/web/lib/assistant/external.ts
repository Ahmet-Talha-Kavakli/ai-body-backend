/**
 * External API'ler — hava (Open-Meteo), deprem (USGS).
 * Kısa cache (5dk) — her mesajda yeniden çağırma.
 */

interface CachedValue<T> {
  value: T
  fetchedAt: number
}

const CACHE = new Map<string, CachedValue<unknown>>()
const TTL_MS = 5 * 60 * 1000 // 5dk

function getCache<T>(key: string): T | null {
  const c = CACHE.get(key)
  if (!c) return null
  if (Date.now() - c.fetchedAt > TTL_MS) {
    CACHE.delete(key)
    return null
  }
  return c.value as T
}

function setCache<T>(key: string, value: T): void {
  CACHE.set(key, { value, fetchedAt: Date.now() })
}

interface WeatherSummary {
  temperatureC: number
  weatherSummary: string
  humidity?: number
  windKmh?: number
}

export async function getWeatherSummary(
  latitude: number,
  longitude: number
): Promise<WeatherSummary | null> {
  const key = `weather:${latitude.toFixed(2)},${longitude.toFixed(2)}`
  const cached = getCache<WeatherSummary>(key)
  if (cached) return cached
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    const data = await res.json()
    const c = data.current ?? {}
    const summary: WeatherSummary = {
      temperatureC: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      windKmh: c.wind_speed_10m,
      weatherSummary: weatherCodeToText(c.weather_code),
    }
    setCache(key, summary)
    return summary
  } catch {
    return null
  }
}

function weatherCodeToText(code: number): string {
  if (code === 0) return 'Açık'
  if ([1, 2, 3].includes(code)) return 'Az bulutlu - Bulutlu'
  if ([45, 48].includes(code)) return 'Sisli'
  if ([51, 53, 55].includes(code)) return 'Çisenti'
  if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Yağmurlu'
  if ([71, 73, 75, 77].includes(code)) return 'Karlı'
  if ([95, 96, 99].includes(code)) return 'Gök gürültülü fırtına'
  return ''
}

interface EarthquakeAlert {
  magnitude: number
  place: string
  time: number // unix ms
  distanceKm: number
}

/**
 * Son 24 saatte kullanıcının konumuna 200km içinde 3.5+ büyüklük deprem.
 * USGS API.
 */
export async function getRecentEarthquake(
  latitude: number,
  longitude: number
): Promise<EarthquakeAlert | null> {
  const key = `eq:${latitude.toFixed(2)},${longitude.toFixed(2)}`
  const cached = getCache<EarthquakeAlert | null>(key)
  if (cached !== null && cached !== undefined) return cached

  try {
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    // 200km bbox
    const dlat = 200 / 111
    const dlon = 200 / (111 * Math.cos((latitude * Math.PI) / 180))
    const url =
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}` +
      `&minmagnitude=3.5&minlatitude=${latitude - dlat}&maxlatitude=${latitude + dlat}` +
      `&minlongitude=${longitude - dlon}&maxlongitude=${longitude + dlon}`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) {
      setCache(key, null)
      return null
    }
    const data = await res.json()
    const features: Array<{
      properties: { mag: number; place: string; time: number }
      geometry: { coordinates: number[] }
    }> = data.features ?? []
    if (!features.length) {
      setCache(key, null)
      return null
    }
    // En yakın + en güçlüyü bul
    const eq = features
      .map((f) => {
        const [lon, lat] = f.geometry.coordinates
        const d = haversine(latitude, longitude, lat ?? 0, lon ?? 0)
        return { feature: f, distanceKm: d }
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)[0]
    if (!eq) {
      setCache(key, null)
      return null
    }
    const alert: EarthquakeAlert = {
      magnitude: eq.feature.properties.mag,
      place: eq.feature.properties.place,
      time: eq.feature.properties.time,
      distanceKm: Math.round(eq.distanceKm),
    }
    setCache(key, alert)
    return alert
  } catch {
    return null
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dlat = toRad(lat2 - lat1)
  const dlon = toRad(lon2 - lon1)
  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dlon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
