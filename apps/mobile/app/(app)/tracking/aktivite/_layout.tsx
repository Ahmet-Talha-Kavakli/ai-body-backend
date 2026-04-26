import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import { AktiviteProvider } from './_ctx';

export default function AktiviteLayout() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AktiviteProvider>
        <NativeTabs>
          <NativeTabs.Trigger name="kesif">
            <NativeTabs.Trigger.Label>Keşfet</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Label>Aktiviteler</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: 'figure.run', selected: 'figure.run' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="rotalar">
            <NativeTabs.Trigger.Label>Rotalar</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="rekorlar">
            <NativeTabs.Trigger.Label>Rekorlar</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="indir">
            <NativeTabs.Trigger.Label>İndir</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon
              sf={{
                default: 'square.and.arrow.down',
                selected: 'square.and.arrow.down.fill',
              }}
            />
          </NativeTabs.Trigger>
        </NativeTabs>
      </AktiviteProvider>
    </>
  );
}
