import { apiSuccess, apiError } from '@/lib/api/response'
import { describe, it, expect } from 'vitest'

describe('apiSuccess', () => {
  it('returns 200 with data and timestamp', async () => {
    const res = apiSuccess({ name: 'test' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ name: 'test' })
    expect(body.timestamp).toBeDefined()
  })

  it('accepts custom status code', async () => {
    const res = apiSuccess({ id: 1 }, 201)
    expect(res.status).toBe(201)
  })
})

describe('apiError', () => {
  it('returns error with message and status', async () => {
    const res = apiError('Not found', 404)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Not found')
    expect(body.timestamp).toBeDefined()
  })

  it('includes errorCode if provided', async () => {
    const res = apiError('Limit aşıldı', 429, 'LIMIT_REACHED')
    const body = await res.json()
    expect(body.errorCode).toBe('LIMIT_REACHED')
  })

  it('omits errorCode when not provided', async () => {
    const res = apiError('Bad request', 400)
    const body = await res.json()
    expect(body.errorCode).toBeUndefined()
  })
})
