// iOS HealthKit + Android Health Connect stub
export async function fetchSleepData(): Promise<any> {
  return { sleepHours: 7.5, quality: 0.8 };
}

export async function fetchHeartRate(): Promise<any> {
  return { bpm: 65, trend: 'stable' };
}

export async function syncHealthData(): Promise<void> {
  const sleep = await fetchSleepData();
  const hr = await fetchHeartRate();
  // Sync to server
  await fetch('/api/health-sync', {
    method: 'POST',
    body: JSON.stringify({ sleep, hr }),
  });
}
