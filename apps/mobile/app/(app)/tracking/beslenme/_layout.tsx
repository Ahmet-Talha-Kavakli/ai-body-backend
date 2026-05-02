import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';

export default function BeslenmeLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NativeTabs iconColor="#FF9F0A" indicatorColor="#FF9F0A" labelStyle={{ color: '#FF9F0A' }}>
        <NativeTabs.Trigger name="takvim">
          <NativeTabs.Trigger.Label>Takvim</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="bugun">
          <NativeTabs.Trigger.Label>Bugün</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="asistan">
          <NativeTabs.Trigger.Label>Asistan</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="diyet">
          <NativeTabs.Trigger.Label>Diyet</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="indir">
          <NativeTabs.Trigger.Label>İndir</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'square.and.arrow.down', selected: 'square.and.arrow.down.fill' }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
