export interface PlanLimits {
  sessionsPerMonth: number
  aiPrograms: number
  aiMeals: number
  aiCoach: number
  wearableSync: boolean
  advancedAnalytics: boolean
  prioritySupport: boolean
}

export const PLANS: Record<string, PlanLimits> = {
  free: {
    sessionsPerMonth: 3,
    aiPrograms: 0,
    aiMeals: 0,
    aiCoach: 0,
    wearableSync: false,
    advancedAnalytics: false,
    prioritySupport: false,
  },
  basic: {
    sessionsPerMonth: 10,
    aiPrograms: 1,
    aiMeals: 0,
    aiCoach: 5,
    wearableSync: true,
    advancedAnalytics: false,
    prioritySupport: false,
  },
  standard: {
    sessionsPerMonth: 30,
    aiPrograms: 5,
    aiMeals: 10,
    aiCoach: 20,
    wearableSync: true,
    advancedAnalytics: true,
    prioritySupport: true,
  },
  pro: {
    sessionsPerMonth: Infinity,
    aiPrograms: Infinity,
    aiMeals: Infinity,
    aiCoach: Infinity,
    wearableSync: true,
    advancedAnalytics: true,
    prioritySupport: true,
  },
}

export const PLAN_PRICES = {
  basic: {
    monthly: 149, // ₺
    priceId: process.env.STRIPE_BASIC_PRICE_ID || '',
  },
  standard: {
    monthly: 299, // ₺
    priceId: process.env.STRIPE_STANDARD_PRICE_ID || '',
  },
  pro: {
    monthly: 599, // ₺
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
  },
}

export function getPlanLimits(tier: string): PlanLimits {
  return PLANS[tier] || PLANS.free
}

export function canUseFeature(tier: string, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(tier)
  const value = limits[feature]

  // If it's a boolean, return directly
  if (typeof value === 'boolean') {
    return value
  }

  // If it's a number and represents a count, just check if it's allowed (>0 or Infinity)
  if (typeof value === 'number') {
    return value > 0 || value === Infinity
  }

  return false
}

export function canUseFeatureWithLimit(
  tier: string,
  feature: 'aiPrograms' | 'aiMeals' | 'aiCoach' | 'sessionsPerMonth',
  used: number
): boolean {
  const limits = getPlanLimits(tier)
  const limit = limits[feature] as number

  if (limit === Infinity) return true
  return used < limit
}

/**
 * Check if usage has reset (monthly reset at subscription renewal)
 */
export function isUsageResetNeeded(usageResetAt: Date): boolean {
  const now = new Date()
  return now.getMonth() !== usageResetAt.getMonth() || now.getFullYear() !== usageResetAt.getFullYear()
}
