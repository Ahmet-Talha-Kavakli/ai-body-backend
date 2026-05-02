import { Stack } from 'expo-router';

export default function ShowcaseLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#000000' },
        headerTintColor: '#30D158',
        headerTitle: 'Design System',
        headerBackTitle: 'Geri',
      }}
    />
  );
}
