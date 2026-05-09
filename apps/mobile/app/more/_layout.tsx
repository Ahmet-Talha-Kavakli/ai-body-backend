import { Stack } from 'expo-router';
import { C, font } from '../../lib/theme';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.page },
        headerTintColor: C.accent,
        headerTitleStyle: { fontFamily: font.semibold, color: C.text },
        headerBackTitle: 'Geri',
        contentStyle: { backgroundColor: C.page },
      }}
    />
  );
}
