import { describe, it, expect } from 'vitest'
import { relativeTime } from '../relative-time'

describe('relativeTime', () => {
  const now = new Date('2026-04-17T12:00:00Z')

  it('returns "az önce" for < 60 seconds', () => {
    const d = new Date(now.getTime() - 30 * 1000)
    expect(relativeTime(d, now)).toBe('az önce')
  })

  it('returns "X dk önce" for minutes', () => {
    const d = new Date(now.getTime() - 5 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('5 dk önce')
  })

  it('returns "1 sa önce" for 1 hour', () => {
    const d = new Date(now.getTime() - 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('1 sa önce')
  })

  it('returns "X sa önce" for hours', () => {
    const d = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('3 sa önce')
  })

  it('returns "dün" for yesterday', () => {
    const d = new Date(now.getTime() - 25 * 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('dün')
  })

  it('returns "X gün önce" for days', () => {
    const d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    expect(relativeTime(d, now)).toBe('3 gün önce')
  })
})
