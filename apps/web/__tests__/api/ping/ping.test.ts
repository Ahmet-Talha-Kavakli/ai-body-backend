import { GET } from '@/app/api/ping/route'
import { NextRequest } from 'next/server'
import { describe, it, expect } from 'vitest'

describe('GET /api/ping', () => {
  it('returns 200 with status ok', async () => {
    const req = new NextRequest('http://localhost/api/ping')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
  })

  it('returns version field', async () => {
    const req = new NextRequest('http://localhost/api/ping')
    const res = await GET(req)
    const body = await res.json()
    expect(body.version).toBeDefined()
  })
})
