export async function getTempBonusMl(city: string): Promise<number | null> {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=tr`
    )
    const geoData = await geoRes.json()

    if (!geoData.results || geoData.results.length === 0) return null

    const { latitude, longitude } = geoData.results[0]

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`
    )
    const weatherData = await weatherRes.json()
    const temp: number = weatherData.current?.temperature_2m

    if (temp === undefined || temp === null) return null

    if (temp < 15) return 0
    if (temp < 25) return 200
    if (temp < 35) return 400
    return 600
  } catch {
    return null
  }
}
