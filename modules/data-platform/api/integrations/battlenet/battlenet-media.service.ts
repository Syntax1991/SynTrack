import { env } from "../../../../../apps/api/src/config/env.js";
import type { BattleNetAppTokenService } from "./battlenet-app-token.service.js";
import type {
  BattleNetMediaResponse
} from "./battlenet.types.js";

type BattleNetMediaKind =
  | "item"
  | "spell";

/*
 * Resolves a real Blizzard-hosted icon URL from a stable Blizzard ID via
 * the Game Data API's Media endpoints - never from a name or a guess.
 * Every failure mode (network error, 404, malformed payload, missing
 * "icon" asset) resolves to null, the caller's cue to keep showing the
 * neutral fallback rather than inventing an icon.
 */
export class BattleNetMediaService {
  constructor(
    private readonly appTokenService:
      BattleNetAppTokenService
  ) {}

  async resolveItemIconUrl(
    itemId: number
  ): Promise<string | null> {
    return this.resolveMediaIconUrl(
      "item",
      itemId
    );
  }

  async resolveSpellIconUrl(
    spellId: number
  ): Promise<string | null> {
    return this.resolveMediaIconUrl(
      "spell",
      spellId
    );
  }

  private async resolveMediaIconUrl(
    kind: BattleNetMediaKind,
    id: number
  ): Promise<string | null> {
    try {
      const accessToken =
        await this.appTokenService
          .getAccessToken();

      const baseUrl =
        `https://${env.BATTLENET_REGION}.api.blizzard.com`;

      const url = new URL(
        `/data/wow/media/${kind}/${id}`,
        baseUrl
      );

      url.searchParams.set(
        "namespace",
        `static-${env.BATTLENET_REGION}`
      );

      url.searchParams.set(
        "locale",
        env.BATTLENET_LOCALE
      );

      const response = await fetch(
        url,
        {
          headers: {
            Accept:
              "application/json",
            Authorization:
              `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const payload =
        await response.json() as
          BattleNetMediaResponse;

      const iconAsset = (
        payload.assets ?? []
      ).find(
        (asset) =>
          asset.key === "icon"
      );

      return iconAsset?.value ?? null;
    }
    catch {
      return null;
    }
  }
}
