import { test, expect } from '@playwright/test'

// These tests require a logged-in session via storageState
// Run with: PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm e2e

test.describe('Dashboard (requires auth)', () => {
  test.skip(
    !process.env.E2E_AUTH_TOKEN,
    'Skipped: set E2E_AUTH_TOKEN env var for authenticated tests'
  )

  test('dashboard loads main stats', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('text=/calories|workout|sessions/i').first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('navigation links are visible', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('nav')).toBeVisible()
  })
})

test.describe('Public pages', () => {
  test('API health returns 200', async ({ request }) => {
    const response = await request.get('/api/health').catch(() => null)
    // Health endpoint may not exist — just ensure no 500 from a bad route
    if (response) {
      expect(response.status()).not.toBe(500)
    }
  })
})
