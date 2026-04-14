import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth and db
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'clerk_123' }),
}))

vi.mock('@/lib/db/client', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 'user_1', clerkId: 'clerk_123' }),
    },
    mealTemplate: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'tpl_1',
          name: 'High Protein Breakfast',
          mealType: 'breakfast',
          totalCalories: 450,
          totalProteinG: 40,
          totalCarbsG: 30,
          totalFatG: 15,
          items: [],
          createdAt: new Date('2026-04-14'),
        },
      ]),
      create: vi.fn().mockResolvedValue({
        id: 'tpl_2',
        name: 'New Template',
        mealType: 'lunch',
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 60,
        totalFatG: 20,
        items: [],
        createdAt: new Date('2026-04-14'),
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: 'tpl_1',
        userId: 'user_1',
      }),
      delete: vi.fn().mockResolvedValue({ id: 'tpl_1' }),
    },
  },
}))

describe('GET /api/nutrition/templates', () => {
  it('returns list of templates for authenticated user', async () => {
    const { GET } = await import('../route')
    const response = await GET()
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(data.templates)).toBe(true)
    expect(data.templates[0].name).toBe('High Protein Breakfast')
  })
})

describe('POST /api/nutrition/templates', () => {
  it('creates a new template', async () => {
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/nutrition/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Template',
        mealType: 'lunch',
        items: [],
        totalCalories: 600,
        totalProteinG: 35,
        totalCarbsG: 60,
        totalFatG: 20,
      }),
    })
    const response = await POST(req as any)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.template.name).toBe('New Template')
  })
})

describe('DELETE /api/nutrition/templates/[id]', () => {
  it('deletes a template belonging to the user', async () => {
    const { DELETE } = await import('../[id]/route')
    const req = new Request('http://localhost/api/nutrition/templates/tpl_1', {
      method: 'DELETE',
    })
    const response = await DELETE(req as any, { params: Promise.resolve({ id: 'tpl_1' }) })
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
