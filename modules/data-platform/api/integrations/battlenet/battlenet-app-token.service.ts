import { env } from "../../../../../apps/api/src/config/env.js";
import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";

const tokenUrl =
  "https://oauth.battle.net/token";

type CachedAppToken = {
  accessToken: string;
  expiresAt: number;
};

/*
 * A client_credentials app-level token - distinct from BattleNetClient's
 * per-user authorization_code tokens (Raider Login). Game Data API media
 * endpoints (item/spell icons) are public, ID-keyed lookups that don't
 * require any user to be logged in, so this uses the app's own
 * BATTLENET_CLIENT_ID/SECRET directly. Cached in-memory and refreshed
 * once it's close to expiry, so a batch of icon lookups reuses one token
 * instead of requesting a new one per call.
 */
export class BattleNetAppTokenService {
  private cachedToken: CachedAppToken | null = null;

  async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (
      this.cachedToken &&
      this.cachedToken.expiresAt > now
    ) {
      return this.cachedToken.accessToken;
    }

    const basicCredentials = Buffer.from(
      `${env.BATTLENET_CLIENT_ID}:${env.BATTLENET_CLIENT_SECRET}`
    ).toString("base64");

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization:
          `Basic ${basicCredentials}`,
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "client_credentials"
      })
    });

    const payload =
      await this.readJsonResponse(response);

    if (
      !response.ok ||
      !this.isTokenPayload(payload)
    ) {
      throw new AppError(
        502,
        "Battle.net app access token could not be issued.",
        payload
      );
    }

    const expiresInMs =
      (
        typeof payload.expires_in ===
        "number"
          ? payload.expires_in
          : 300
      ) * 1000;

    this.cachedToken = {
      accessToken:
        payload.access_token,
      /*
       * Refreshed 30s before actual expiry so a lookup never starts
       * with a token that expires mid-flight.
       */
      expiresAt:
        now + expiresInMs - 30_000
    };

    return this.cachedToken.accessToken;
  }

  private async readJsonResponse(
    response: Response
  ): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text) as unknown;
    }
    catch {
      return {
        response: text.slice(0, 500)
      };
    }
  }

  private isTokenPayload(
    payload: unknown
  ): payload is {
    access_token: string;
    expires_in?: number;
  } {
    if (
      typeof payload !== "object" ||
      payload === null
    ) {
      return false;
    }

    const candidate =
      payload as Record<string, unknown>;

    return (
      typeof candidate.access_token ===
      "string"
    );
  }
}
