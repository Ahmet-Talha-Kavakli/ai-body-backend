import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';

const ACCENT = '#5E5CE6';

export default function UykuLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NativeTabs iconColor={ACCENT} indicatorColor={ACCENT} labelStyle={{ color: ACCENT }}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Bugün</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'moon', selected: 'moon.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="araclar">
          <NativeTabs.Trigger.Label>Araçlar</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'wand.and.stars', selected: 'wand.and.stars' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="baslat">
          <NativeTabs.Trigger.Label>Başlat</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'bed.double', selected: 'bed.double.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="takvim">
          <NativeTabs.Trigger.Label>Takvim</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} />
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
