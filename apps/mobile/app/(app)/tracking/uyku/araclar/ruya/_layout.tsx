import { Stack } from 'expo-router';

export default function RuyaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F2F2F7' },
        animation: 'slide_from_right',
      }}
    />
  );
}
