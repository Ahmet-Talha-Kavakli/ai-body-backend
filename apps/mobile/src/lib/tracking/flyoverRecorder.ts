/**
 * Flyover recorder wrapper.
 *
 * Bridges the local `flyover-recorder` Expo module (ReplayKit on iOS) to the
 * tracking screen. All functions are best-effort — on platforms where the
 * native module is unavailable (Android, Expo Go) they degrade silently.
 */

import * as FlyoverNative from '../../../modules/flyover-recorder/src';

export async function startRecording(): Promise<void> {
  return FlyoverNative.startRecording();
}

export async function stopRecording(): Promise<{ uri: string } | null> {
  return FlyoverNative.stopRecording();
}

export async function isRecordingAvailable(): Promise<boolean> {
  return FlyoverNative.isAvailable();
}
