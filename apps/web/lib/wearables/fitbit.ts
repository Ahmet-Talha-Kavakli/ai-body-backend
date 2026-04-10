// Fitbit OAuth integration
export interface FitbitConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface FitbitDeviceData {
  deviceId?: string;
  deviceName?: string;
  steps?: number;
  calories?: number;
  distance?: number;
  heartRate?: number;
  sleepMinutes?: number;
}

export async function getFitbitAuthUrl(config: FitbitConfig): Promise<string> {
  // Stub: Returns Fitbit OAuth authorization URL
  return `https://www.fitbit.com/oauth2/authorize?client_id=${config.clientId}&redirect_uri=${config.redirectUri}&response_type=code`;
}

export async function exchangeFitbitToken(
  code: string,
  config: FitbitConfig
): Promise<{ accessToken: string; refreshToken: string }> {
  // Stub: Exchanges auth code for access and refresh tokens
  return {
    accessToken: `fitbit_access_${code}`,
    refreshToken: `fitbit_refresh_${code}`,
  };
}

export async function fetchFitbitDeviceData(
  accessToken: string,
  deviceId: string
): Promise<FitbitDeviceData> {
  // Stub: Fetches device data from Fitbit API
  return {};
}
