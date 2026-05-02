import { Stack } from 'expo-router';
import { DietScreen } from '@/src/features/diet/screens/DietScreen';

export default function DiyetPage() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DietScreen />
    </>
  );
}
