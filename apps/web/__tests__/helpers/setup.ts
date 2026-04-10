import { vi } from 'vitest'

// Mock external dependencies at setup time
vi.mock('@prisma/client', () => {
  const mockDb = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userFriend: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userActivity: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    leaderboard: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    workoutAnalytics: {
      findMany: vi.fn(),
    },
    dailyMetrics: {
      findMany: vi.fn(),
    },
    userWeakness: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  }

  return {
    PrismaClient: vi.fn(() => mockDb),
  }
})

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockReturnValue({ userId: 'clerk_test_user_1' }),
}))

// Polyfills for Node.js runtime (if needed)
// Node 20+ has Request/Response built-in, but ensure they're available
if (typeof global.Request === 'undefined') {
  // Fallback not needed for Node 20
}
