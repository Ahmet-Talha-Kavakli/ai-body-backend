import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, timestamp: new Date().toISOString() }, { status })
}

export function apiError(message: string, status: number, errorCode?: string) {
  return NextResponse.json(
    { error: message, ...(errorCode ? { errorCode } : {}), timestamp: new Date().toISOString() },
    { status }
  )
}
