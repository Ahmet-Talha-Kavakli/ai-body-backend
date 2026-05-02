import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';

const ACCENT = '#FF2D55';

export default function SaglikLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NativeTabs iconColor={ACCENT} indicatorColor={ACCENT} labelStyle={{ color: ACCENT }}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Takvim</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="asistan">
          <NativeTabs.Trigger.Label>Asistan</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'sparkles', selected: 'sparkles' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="vucut">
          <NativeTabs.Trigger.Label>Vücut</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'figure.arms.open', selected: 'figure.arms.open' }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="ilac">
          <NativeTabs.Trigger.Label>İlaç</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'pills', selected: 'pills.fill' }} />
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
