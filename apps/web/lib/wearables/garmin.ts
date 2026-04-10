// Garmin OAuth integration
export interface GarminConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GarminActivityData {
  activityId?: string;
  activityName?: string;
  duration?: number;
  calories?: number;
  steps?: number;
  heartRate?: number;
  timestamp?: number;
}

export async function getGarminAuthUrl(config: GarminConfig): Promise<string> {
  // Stub: Returns Garmin OAuth authorization URL
  return `https://auth.garmin.com/oauth?client_id=${config.clientId}&redirect_uri=${config.redirectUri}`;
}

export async function exchangeGarminToken(
  code: string,
  config: GarminConfig
): Promise<{ accessToken: string; refreshToken: string }> {
  // Stub: Exchanges auth code for access and refresh tokens
  return {
    accessToken: `garmin_access_${code}`,
    refreshToken: `garmin_refresh_${code}`,
  };
}

export async function fetchGarminActivities(
  accessToken: string
): Promise<GarminActivityData[]> {
  // Stub: Fetches activities from Garmin Connect
  return [];
}
