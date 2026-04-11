import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/FitAI|Fit/i)
  })

  test('unauthenticated user redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    // Clerk redirects unauthenticated users to sign-in
    await expect(page).toHaveURL(/sign-in|login/i)
  })

  test('sign-in page is accessible', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.locator('input[type="email"], input[name="identifier"]')).toBeVisible()
  })
})
