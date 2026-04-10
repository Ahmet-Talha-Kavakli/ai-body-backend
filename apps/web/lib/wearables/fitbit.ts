import axios from "axios";

const FITBIT_AUTH_URL = "https://www.fitbit.com/oauth2/authorize";
const FITBIT_TOKEN_URL = "https://api.fitbit.com/oauth2/token";

export interface FitbitConfig {
  clientId: string;
  clientSecret: string;
}

export class FitbitClient {
  private config: FitbitConfig;

  constructor(config: FitbitConfig) {
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
      scope: "activity read sleep read profile read",
      state,
    });

    return `${FITBIT_AUTH_URL}?${params.toString()}`;
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
    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const response = await axios.post(
      FITBIT_TOKEN_URL,
      {
        client_id: this.config.clientId,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
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
    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`
    ).toString("base64");

    const response = await axios.post(
      FITBIT_TOKEN_URL,
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Get user's heart rate data
   */
  async getHeartRate(
    accessToken: string,
    date: string
  ): Promise<Array<{ time: string; value: number }>> {
    const response = await axios.get(
      `https://api.fitbit.com/1/user/-/activities/heart/date/${date}/1d.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data["activities-heart"] || [];
  }

  /**
   * Get user's sleep data
   */
  async getSleep(accessToken: string, date: string) {
    const response = await axios.get(
      `https://api.fitbit.com/1.2/user/-/sleep/date/${date}.json`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data.sleep || [];
  }
}

export function createFitbitClient(): FitbitClient {
  return new FitbitClient({
    clientId: process.env.FITBIT_CLIENT_ID || "",
    clientSecret: process.env.FITBIT_CLIENT_SECRET || "",
  });
}
