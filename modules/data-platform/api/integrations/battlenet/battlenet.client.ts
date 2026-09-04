import { env } from "../../../../../apps/api/src/config/env.js";
import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import type { BattleNetAccountProfile, BattleNetCharacterEquipment, BattleNetCharacterProfile, BattleNetGuildRoster, BattleNetMythicKeystoneProfile, BattleNetMythicKeystoneSeasonProfile, BattleNetProfessionsResponse, BattleNetTokenResponse, BattleNetUserInfo } from "./battlenet.types.js";

const authorizationUrl = "https://oauth.battle.net/authorize";
const tokenUrl = "https://oauth.battle.net/token";
const userInfoUrl = "https://oauth.battle.net/userinfo";

export class BattleNetClient {
  createAuthorizationUrl(
    state: string,
    redirectUri: string
  ): string {
    const url = new URL(authorizationUrl);

    url.searchParams.set(
      "client_id",
      env.BATTLENET_CLIENT_ID
    );

    url.searchParams.set(
      "redirect_uri",
      redirectUri
    );

    url.searchParams.set(
      "response_type",
      "code"
    );

    url.searchParams.set(
      "scope",
      "openid wow.profile"
    );

    url.searchParams.set(
      "state",
      state
    );

    return url.toString();
  }

  async exchangeAuthorizationCode(
    code: string,
    redirectUri: string
  ): Promise<BattleNetTokenResponse> {
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
        grant_type: "authorization_code",
        code,
        redirect_uri:
          redirectUri
      })
    });

    const payload =
      await this.readJsonResponse(response);

    if (
      !response.ok ||
      !this.isTokenResponse(payload)
    ) {
      throw new AppError(
        502,
        "Battle.net konnte den Autorisierungscode nicht einlösen.",
        payload
      );
    }

    return payload;
  }

  async getUserInfo(
    accessToken: string
  ): Promise<BattleNetUserInfo> {
    const response = await fetch(
      userInfoUrl,
      {
        headers: {
          Accept: "application/json",
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

    const payload =
      await this.readJsonResponse(response);

    if (!response.ok) {
      throw new AppError(
        502,
        "Battle.net-Benutzerinformationen konnten nicht geladen werden.",
        payload
      );
    }

    return payload as BattleNetUserInfo;
  }

  async getAccountProfile(
    accessToken: string
  ): Promise<BattleNetAccountProfile> {
    const result =
      await this.getProfileResource<
        BattleNetAccountProfile
      >(
        "/profile/user/wow",
        accessToken
      );

    if (!result) {
      throw new AppError(
        404,
        "Für dieses Battle.net-Konto wurde kein World-of-Warcraft-Profil gefunden."
      );
    }

    return result;
  }

  async getCharacterProfessions(
    accessToken: string,
    realmSlug: string,
    characterName: string
  ): Promise<BattleNetProfessionsResponse> {
    const [encodedRealm, encodedName] = this.encodeCharacterSlugs(realmSlug, characterName);

    const result = await this.getProfileResource<BattleNetProfessionsResponse>(
      `/profile/wow/character/${encodedRealm}/${encodedName}/professions`,
      accessToken,
      true
    );

    return result ?? { primaries: [], secondaries: [] };
  }

  async getCharacterProfile(
    accessToken: string,
    realmSlug: string,
    characterName: string
  ): Promise<BattleNetCharacterProfile | null> {
    const [encodedRealm, encodedName] = this.encodeCharacterSlugs(realmSlug, characterName);

    return this.getProfileResource<BattleNetCharacterProfile>(
      `/profile/wow/character/${encodedRealm}/${encodedName}`,
      accessToken,
      true
    );
  }

  async getGuildRoster(
    accessToken: string,
    realmSlug: string,
    guildSlug: string
  ): Promise<BattleNetGuildRoster | null> {
    const encodedRealm = encodeURIComponent(
      realmSlug.toLowerCase()
    );

    const encodedGuild = encodeURIComponent(
      guildSlug.toLowerCase()
    );

    return this.getProfileResource<
      BattleNetGuildRoster
    >(
      `/data/wow/guild/${encodedRealm}/${encodedGuild}/roster`,
      accessToken,
      true
    );
  }

  async getCharacterEquipment(
    accessToken: string,
    realmSlug: string,
    characterName: string
  ): Promise<BattleNetCharacterEquipment | null> {
    const [encodedRealm, encodedName] = this.encodeCharacterSlugs(realmSlug, characterName);

    return this.getProfileResource<BattleNetCharacterEquipment>(
      `/profile/wow/character/${encodedRealm}/${encodedName}/equipment`,
      accessToken,
      true
    );
  }

  // null = no Mythic Keystone profile (same allowNotFound contract as
  // getCharacterProfile/getCharacterEquipment; genuine "never done M+").
  async getCharacterMythicKeystoneProfile(
    accessToken: string,
    realmSlug: string,
    characterName: string
  ): Promise<BattleNetMythicKeystoneProfile | null> {
    const [encodedRealm, encodedName] = this.encodeCharacterSlugs(realmSlug, characterName);

    return this.getProfileResource<BattleNetMythicKeystoneProfile>(
      `/profile/wow/character/${encodedRealm}/${encodedName}/mythic-keystone-profile`,
      accessToken,
      true
    );
  }

  // Season-wide per-dungeon best runs (Phase D.2) - same null/404
  // contract as getCharacterMythicKeystoneProfile.
  async getCharacterMythicKeystoneProfileSeason(
    accessToken: string,
    realmSlug: string,
    characterName: string,
    seasonId: number
  ): Promise<BattleNetMythicKeystoneSeasonProfile | null> {
    const [encodedRealm, encodedName] = this.encodeCharacterSlugs(realmSlug, characterName);

    return this.getProfileResource<BattleNetMythicKeystoneSeasonProfile>(
      `/profile/wow/character/${encodedRealm}/${encodedName}/mythic-keystone-profile/season/${seasonId}`,
      accessToken,
      true
    );
  }

  private encodeCharacterSlugs(
    realmSlug: string,
    characterName: string
  ): [string, string] {
    return [
      encodeURIComponent(realmSlug.toLowerCase()),
      encodeURIComponent(characterName.toLowerCase())
    ];
  }

  private async getProfileResource<T>(
    path: string,
    accessToken: string,
    allowNotFound = false
  ): Promise<T | null> {
    const baseUrl =
      `https://${env.BATTLENET_REGION}.api.blizzard.com`;

    const url = new URL(path, baseUrl);

    url.searchParams.set(
      "namespace",
      `profile-${env.BATTLENET_REGION}`
    );

    url.searchParams.set(
      "locale",
      env.BATTLENET_LOCALE
    );

    const response = await fetch(
      url,
      {
        headers: {
          Accept: "application/json",
          Authorization:
            `Bearer ${accessToken}`
        }
      }
    );

    if (
      response.status === 404 &&
      allowNotFound
    ) {
      return null;
    }

    const payload =
      await this.readJsonResponse(response);

    if (response.status === 401) {
      throw new AppError(
        401,
        "Die Battle.net-Verbindung ist abgelaufen. Bitte erneut verbinden."
      );
    }

    if (!response.ok) {
      throw new AppError(
        502,
        `Battle.net-Anfrage fehlgeschlagen (${response.status}).`,
        payload
      );
    }

    return payload as T;
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

  private isTokenResponse(
    payload: unknown
  ): payload is BattleNetTokenResponse {
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
        "string" &&
      typeof candidate.token_type ===
        "string"
    );
  }
}