import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';

export default function SuLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NativeTabs iconColor="#32ADE6" indicatorColor="#32ADE6" labelStyle={{ color: '#32ADE6' }}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Takip</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'drop', selected: 'drop.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="kaplar">
          <NativeTabs.Trigger.Label>İçeceklerim</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'cup.and.saucer', selected: 'cup.and.saucer.fill' }}
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="rekorlar">
          <NativeTabs.Trigger.Label>Rekorlar</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} />
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
