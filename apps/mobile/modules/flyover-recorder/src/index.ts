import { requireNativeModule } from 'expo-modules-core';

interface FlyoverRecorderApi {
  startRecording(): Promise<void>;
  stopRecording(): Promise<{ uri: string }>;
  isAvailable(): Promise<boolean>;
}

const native: FlyoverRecorderApi | null = (() => {
  try {
    return requireNativeModule('FlyoverRecorder') as FlyoverRecorderApi;
  } catch {
    return null;
  }
})();

export async function startRecording(): Promise<void> {
  if (!native) return;
  await native.startRecording();
}

export async function stopRecording(): Promise<{ uri: string } | null> {
  if (!native) return null;
  return native.stopRecording();
}

export async function isAvailable(): Promise<boolean> {
  if (!native) return false;
  return native.isAvailable();
}
