// Re-export hooks from web to make them available for mobile
export { useVapiCoach } from '@fitai/shared-hooks/useVapiCoach';

// Common hooks (to be created)
export function useFormAnalysis() {
  // Placeholder - analyze form from video
  return { analyze: async (video: any) => ({ score: 0, feedback: '' }) };
}

export function useHealthMetrics() {
  // Placeholder - fetch health data
  return { fetch: async () => ({ sleep: 0, hr: 0, readiness: 0 }) };
}

export function useProgressTracking() {
  // Placeholder - track user progress
  return { track: async () => ({}) };
}

export function useOfflineSession() {
  // Placeholder - manage offline session
  return { save: async (session: any) => true, sync: async () => true };
}
