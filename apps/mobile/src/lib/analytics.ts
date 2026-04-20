// Event naming convention: <domain>_<object>_<verb>
// Required props on every event: platform, app_version
import { PostHog } from 'posthog-react-native';
import { Platform } from 'react-native';
import { env } from '../env';

let client: PostHog | null = null;

export function initAnalytics() {
  if (!env.EXPO_PUBLIC_POSTHOG_KEY) return;
  if (client) return;

  client = new PostHog(env.EXPO_PUBLIC_POSTHOG_KEY, {
    host: env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
  });
}

type EventProperties = Record<string, string | number | boolean | null>;

function baseProps(): EventProperties {
  return {
    platform: Platform.OS,
    app_version: '1.0.0',
  };
}

export function trackEvent(name: string, properties?: EventProperties) {
  if (!client) return;
  client.capture(name, { ...baseProps(), ...properties });
}

export function identifyUser(userId: string, traits?: EventProperties) {
  if (!client) return;
  client.identify(userId, { ...baseProps(), ...traits });
}

export function trackScreen(screenName: string) {
  trackEvent('screen_viewed', { screen_name: screenName });
}

export function resetAnalytics() {
  client?.reset();
}
