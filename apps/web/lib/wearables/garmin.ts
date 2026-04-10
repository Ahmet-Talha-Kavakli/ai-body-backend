import axios from "axios";

const GARMIN_AUTH_URL = "https://auth.garmin.com/oauth-portal/oauth/authorize";
const GARMIN_TOKEN_URL = "https://auth.garmin.com/oauth-portal/oauth/token";

export interface GarminConfig {
  clientId: string;
  clientSecret: string;
}

export class GarminClient {
  private config: GarminConfig;

  constructor(config: GarminConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "activity:read activity:write sleep:read",
      state,
    });

    return `${GARMIN_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(
      GARMIN_TOKEN_URL,
      {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(GARMIN_TOKEN_URL, {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Get user's heart rate variability
   */
  async getHeartRateVariability(accessToken: string): Promise<
    Array<{
      date: string;
      hrv: number;
      rmssd: number;
    }>
  > {
    const response = await axios.get(
      "https://apis.garmin.com/wellness-api/rest/hrv",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.hrv || [];
  }

  /**
   * Get user's sleep data
   */
  async getSleepData(accessToken: string, startDate: Date, endDate: Date) {
    const response = await axios.get(
      "https://apis.garmin.com/wellness-api/rest/sleep",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
        },
      }
    );

    return response.data;
  }
}

export function createGarminClient(): GarminClient {
  return new GarminClient({
    clientId: process.env.GARMIN_CLIENT_ID || "",
    clientSecret: process.env.GARMIN_CLIENT_SECRET || "",
  });
}
