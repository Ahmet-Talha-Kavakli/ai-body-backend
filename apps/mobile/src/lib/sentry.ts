import * as Sentry from '@sentry/react-native';
import { env } from '../env';

export function initSentry() {
  if (!env.EXPO_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableNative: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    _experiments: { profilesSampleRate: 0.1 },
    beforeBreadcrumb(breadcrumb) {
      // Strip console logs — too noisy and may contain PII
      if (breadcrumb.category === 'console') return null;
      return breadcrumb;
    },
  });
}

export function setSentryUser(userId: string) {
  Sentry.setUser({ id: userId });
}

export function clearSentryUser() {
  Sentry.setUser(null);
}
