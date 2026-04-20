import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useI18n } from '../../src/providers/I18nProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg.surface,
          borderTopColor: colors.border.subtle,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="train" options={{ title: t('tabs.train') }} />
      <Tabs.Screen name="nutrition" options={{ title: t('tabs.nutrition') }} />
      <Tabs.Screen name="health" options={{ title: t('tabs.health') }} />
      <Tabs.Screen name="you" options={{ title: t('tabs.you') }} />
    </Tabs>
  );
}
