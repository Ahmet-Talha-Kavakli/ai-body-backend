import { GrowthBook } from '@growthbook/growthbook';
import { env } from '../env';

export const growthbook = new GrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: env.EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY ?? '',
  enableDevMode: __DEV__,
  trackingCallback: (experiment, result) => {
    if (__DEV__) {
      console.warn('[GrowthBook]', experiment.key, result.variationId);
    }
  },
});

export async function initFeatureFlags(userId?: string) {
  if (userId) growthbook.setAttributes({ id: userId, loggedIn: true });
  await growthbook.loadFeatures({ autoRefresh: true });
}

export function isFeatureEnabled(key: string): boolean {
  return growthbook.isOn(key);
}
