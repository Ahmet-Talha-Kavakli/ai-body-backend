import React from 'react';
import { Stack, Redirect } from 'expo-router';

export default function BeslenmeIndex() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Redirect href="/(app)/tracking/beslenme/bugun" />
    </>
  );
}
