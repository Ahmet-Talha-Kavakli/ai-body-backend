import { NextRequest, NextResponse } from 'next/server'

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') ?? 'Istanbul'

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'unavailable' })
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=tr`
    const res = await fetch(url, { next: { revalidate: 600 } })

    if (!res.ok) {
      console.error('[weather GET] upstream error', res.status)
      return NextResponse.json({ error: 'unavailable' })
    }

    const data = (await res.json()) as {
      main: { temp: number; feels_like: number; humidity: number }
      weather: Array<{ description: string; icon: string }>
      name: string
    }

    return NextResponse.json({
      temp: Math.round(data.main.temp),
      description: data.weather[0]?.description ?? '',
      icon: data.weather[0]?.icon ?? '',
      city: data.name,
      humidity: data.main.humidity,
      feelsLike: Math.round(data.main.feels_like),
    })
  } catch (error) {
    console.error('[weather GET]', error)
    return NextResponse.json({ error: 'unavailable' })
  }
}
