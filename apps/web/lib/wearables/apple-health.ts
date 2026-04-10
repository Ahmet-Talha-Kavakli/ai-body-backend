import axios from "axios";

const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";

export interface AppleHealthConfig {
  teamId: string;
  keyId: string;
  bundleId: string;
  clientSecret: string;
}

export class AppleHealthClient {
  private config: AppleHealthConfig;

  constructor(config: AppleHealthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: this.config.bundleId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "profile email",
      state,
      response_mode: "form_post",
    });

    return `${APPLE_AUTH_URL}?${params.toString()}`;
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
    const data = new URLSearchParams({
      client_id: this.config.bundleId,
      client_secret: this.config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const response = await axios.post(APPLE_TOKEN_URL, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

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
    const data = new URLSearchParams({
      client_id: this.config.bundleId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await axios.post(APPLE_TOKEN_URL, data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  }

  /**
   * Fetch health data from Apple Health
   */
  async getHealthData(
    accessToken: string,
    dataTypes: string[]
  ): Promise<Record<string, unknown>> {
    const response = await axios.get("https://api.example.com/health/data", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        data_types: dataTypes.join(","),
      },
    });

    return response.data;
  }
}

export function createAppleHealthClient(): AppleHealthClient {
  return new AppleHealthClient({
    teamId: process.env.APPLE_TEAM_ID || "",
    keyId: process.env.APPLE_KEY_ID || "",
    bundleId: process.env.APPLE_BUNDLE_ID || "",
    clientSecret: process.env.APPLE_CLIENT_SECRET || "",
  });
}
