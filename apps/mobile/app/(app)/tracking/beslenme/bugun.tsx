import React from 'react';
import { Stack } from 'expo-router';
import NutritionHost from '../../../../src/features/nutrition/NutritionHost';

export default function BeslenmeBugunScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <NutritionHost />
    </>
  );
}
