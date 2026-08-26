import { env } from "../../../../../apps/api/src/config/env.js";
import type { BattleNetAppTokenService } from "./battlenet-app-token.service.js";
import type {
  BattleNetItemResponse
} from "./battlenet.types.js";

export type BattleNetItemDetails = {
  quality: string | null;
  level: number | null;
};

/*
 * Resolves an item's exact Blizzard quality enum ("POOR" | "COMMON" |
 * "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY" | "ARTIFACT" | "HEIRLOOM")
 * and item level from the Item Game Data API - purely by itemId, never
 * inferred from name, icon border, or recipe metadata. Any failure
 * (network error, unknown id, malformed payload) resolves to a fully
 * null result rather than a guessed value.
 */
export class BattleNetItemService {
  constructor(
    private readonly appTokenService:
      BattleNetAppTokenService
  ) {}

  async resolveItemDetails(
    itemId: number
  ): Promise<BattleNetItemDetails | null> {
    try {
      const accessToken =
        await this.appTokenService
          .getAccessToken();

      const baseUrl =
        `https://${env.BATTLENET_REGION}.api.blizzard.com`;

      const url = new URL(
        `/data/wow/item/${itemId}`,
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
          BattleNetItemResponse;

      const quality =
        payload.quality?.type ??
        null;

      const level =
        typeof payload.level ===
        "number"
          ? payload.level
          : null;

      return {
        quality,
        level
      };
    }
    catch {
      return null;
    }
  }
}
