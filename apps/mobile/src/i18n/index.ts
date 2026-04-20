import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import tr from './messages/tr.json';
import en from './messages/en.json';

export const i18n = new I18n({ tr, en });

i18n.defaultLocale = 'tr';
i18n.enableFallback = true;

// Set from device locale on init
const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'tr';
i18n.locale = ['tr', 'en'].includes(deviceLocale) ? deviceLocale : 'tr';

export type SupportedLocale = 'tr' | 'en';

export function setLocale(locale: SupportedLocale) {
  i18n.locale = locale;
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
