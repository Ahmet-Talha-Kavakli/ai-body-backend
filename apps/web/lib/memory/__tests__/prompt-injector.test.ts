import { describe, it, expect, vi } from 'vitest'
import { buildMemoryBlock, injectMemoryIntoPrompt } from '../prompt-injector'

vi.mock('../memory-retriever', () => ({
  retrieveMemoryContext: vi.fn().mockResolvedValue({
    memories: [
      '[Antrenman - 01.04.2026] Squat: 3x5 @ 100kg, form: 85/100',
      '[Haftalık Özet] 4 antrenman, iyi tutarlılık, uyku ort: 7.2s',
    ],
    totalRetrieved: 2,
    types: ['SESSION_SUMMARY', 'WEEKLY_SUMMARY'],
  }),
}))

describe('buildMemoryBlock', () => {
  it('wraps memories in a labeled section', () => {
    const block = buildMemoryBlock(['mem 1', 'mem 2'])
    expect(block).toContain('KULLANICI GEÇMİŞİ')
    expect(block).toContain('mem 1')
    expect(block).toContain('mem 2')
  })

  it('returns empty string when no memories', () => {
    expect(buildMemoryBlock([])).toBe('')
  })
})

describe('injectMemoryIntoPrompt', () => {
  it('appends memory block after base prompt', async () => {
    const result = await injectMemoryIntoPrompt('user_123', 'squat coaching', 'Sen bir koçsun.')
    expect(result).toContain('Sen bir koçsun.')
    expect(result).toContain('KULLANICI GEÇMİŞİ')
    expect(result).toContain('Squat')
  })

  it('memory block comes after base prompt', async () => {
    const result = await injectMemoryIntoPrompt('user_123', 'squat', 'BENIM_PROMPT')
    expect(result.indexOf('BENIM_PROMPT')).toBeLessThan(result.indexOf('KULLANICI GEÇMİŞİ'))
  })

  it('returns original prompt when no memories', async () => {
    const { retrieveMemoryContext } = await import('../memory-retriever')
    ;(retrieveMemoryContext as any).mockResolvedValueOnce({
      memories: [],
      totalRetrieved: 0,
      types: [],
    })
    const result = await injectMemoryIntoPrompt('user_123', 'x', 'Base prompt.')
    expect(result).toBe('Base prompt.')
  })
})
