import React, { createContext, useContext, useState } from 'react';
import { i18n, setLocale, SupportedLocale, t as translate } from '../i18n';

type I18nContextValue = {
  locale: SupportedLocale;
  t: typeof translate;
  changeLocale: (locale: SupportedLocale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(
    (i18n.locale as SupportedLocale) ?? 'tr',
  );

  function changeLocale(next: SupportedLocale) {
    setLocale(next);
    setLocaleState(next);
  }

  return (
    <I18nContext.Provider value={{ locale, t: translate, changeLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
