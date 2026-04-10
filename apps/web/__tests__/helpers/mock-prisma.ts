import { vi } from 'vitest'

export const mockDb = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
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

// Mock Prisma client first
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockDb),
}))

// Mock the db client module
vi.mock('@/lib/db/client', () => ({
  db: mockDb,
  prisma: mockDb,
}))
