/**
 * Structured logger using pino.
 * Use this instead of console.log/error throughout the codebase.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info({ userId }, 'User signed in')
 *   logger.error({ err, userId }, 'Failed to process payment')
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  // In tests, silence the logger entirely
  ...(isTest ? { level: 'silent' } : {}),
  // In dev, use pretty formatting
  ...(isDev && !isTest
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  // In production, output JSON with timestamp
  ...(!isDev && !isTest
    ? {
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level: (label: string) => ({ level: label }),
        },
      }
    : {}),
})

/**
 * Create a child logger with a fixed context (e.g. route name).
 * logger.child({ route: '/api/dashboard/stats' })
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}
