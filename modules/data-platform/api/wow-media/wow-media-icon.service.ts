import { mapWithConcurrency } from "../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import {
  canonicalPlayableClassNames,
  playableClassIdForCanonicalName
} from "../../../my-syntrack/api/character-external-sync/wow-class-catalog.js";
import type { BattleNetMediaService } from "../integrations/battlenet/battlenet-media.service.js";
import {
  catalogProfessionKeys,
  getBattleNetIdByProfessionKey
} from "../integrations/battlenet/battlenet.profession-map.js";

const MEDIA_RESOLVE_CONCURRENCY = 4;

export type WowMediaIconsView = {
  classes: Record<string, string | null>;
  professions: Record<string, string | null>;
};

/*
 * Resolves Blizzard-hosted class and profession icons by stable Game
 * Data IDs (never by localized name). The first completed pass is kept
 * in process memory so later page loads are a plain map read, including
 * unresolved nulls - a restart retries those.
 */
export class WowMediaIconService {
  private cached: WowMediaIconsView | null = null;
  private inflight: Promise<WowMediaIconsView> | null = null;

  constructor(private readonly mediaService: BattleNetMediaService) {}

  async getIcons(): Promise<WowMediaIconsView> {
    if (this.cached) {
      return this.cached;
    }

    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = this.resolveAll();

    try {
      this.cached = await this.inflight;
      return this.cached;
    } finally {
      this.inflight = null;
    }
  }

  private async resolveAll(): Promise<WowMediaIconsView> {
    const classNames = canonicalPlayableClassNames();
    const professionKeys = catalogProfessionKeys();

    const [classIcons, professionIcons] = await Promise.all([
      mapWithConcurrency(classNames, MEDIA_RESOLVE_CONCURRENCY, async (name) => {
        const classId = playableClassIdForCanonicalName(name);
        const iconUrl =
          classId === null
            ? null
            : await this.mediaService.resolvePlayableClassIconUrl(classId);
        return [name, iconUrl] as const;
      }),
      mapWithConcurrency(
        professionKeys,
        MEDIA_RESOLVE_CONCURRENCY,
        async (key) => {
          const professionId = getBattleNetIdByProfessionKey(key);
          const iconUrl =
            professionId === null
              ? null
              : await this.mediaService.resolveProfessionIconUrl(professionId);
          return [key, iconUrl] as const;
        }
      )
    ]);

    return {
      classes: Object.fromEntries(classIcons),
      professions: Object.fromEntries(professionIcons)
    };
  }
}
