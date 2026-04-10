import { vi } from 'vitest'

export const mockAuth = vi.fn().mockReturnValue({ userId: 'clerk_test_user_1' })

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))
