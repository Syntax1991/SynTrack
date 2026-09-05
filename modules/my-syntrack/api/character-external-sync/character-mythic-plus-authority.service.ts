import { CharacterMythicPlusAddonFallbackRepository } from "./character-mythic-plus-addon-fallback.repository.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_MYTHIC_PLUS,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type {
  AuthoritativeMythicPlusResult,
  NormalizedBlizzardMythicPlusPayload
} from "./character-external-sync.types.js";

/*
 * M+ rating/best runs can move daily during active play - same
 * volatility reasoning as Equipment (24h), not Profile's 7 days or
 * Professions' 3 days.
 */
const BLIZZARD_MYTHIC_PLUS_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/** Shared "nothing known yet" result - avoids re-typing this literal at every call site. */
export const NONE_AUTHORITATIVE_MYTHIC_PLUS: AuthoritativeMythicPlusResult = {
  source: "NONE",
  rating: null,
  hasProfile: false,
  bestRuns: [],
  periodId: null,
  fetchedAt: null,
  isStale: false
};

/*
 * PUBLIC/SEASONAL Mythic+ rating and best-runs: PRIMARY=BLIZZARD,
 * FALLBACK=the addon's own seasonal rating tracker value. Provider
 * authority beats cross-provider freshness, exactly like Equipment/
 * Profile/Professions.
 *
 * One deliberate nuance specific to this domain: a Blizzard snapshot
 * with hasProfile=false (a clean, confirmed "no Mythic Keystone profile"
 * 404) is treated the SAME as "no successful Blizzard snapshot yet" for
 * resolution purposes - it falls back to ADDON rather than overriding a
 * real addon-captured rating with null. This was a deliberate, evidence-
 * based call made during Phase D's live verification: the Mythic
 * Keystone Profile endpoint was observed, live, to intermittently return
 * a clean 404 for characters known (via this same session's earlier
 * capture) to have real Mythic+ history - Blizzard's 404 does not
 * distinguish "genuinely never done M+" from "this specific sub-resource
 * is momentarily unavailable" at the HTTP level. Only BLIZZARD is ever
 * primary for bestRuns (there is no addon equivalent of per-run
 * evidence), so a hasProfile:false/stale/no-snapshot result always
 * reports an empty bestRuns array regardless of source.
 *
 * Phase F1 corrective review (2nd pass): an earlier version compared
 * Blizzard's `last_login_timestamp` against the addon tracker's own
 * `updatedAt`, treating a newer addon observation as proof Blizzard was
 * behind. That was removed - a login timestamp does not attest to when
 * Blizzard's Mythic+ resource was last refreshed, and the real
 * discrepancy observed live (addon 3126 vs. Blizzard 3125 for the same
 * character) does not prove either source wrong; it is simply outside
 * what any freshness signal available here can safely resolve. This
 * stays BLIZZARD-primary/ADDON-fallback, gated only by fetch-age
 * staleness, until a real incorrect-value case is demonstrated.
 */
export class CharacterMythicPlusAuthorityService {
  constructor(
    private readonly snapshotRepository: CharacterExternalSnapshotRepository,
    private readonly addonFallbackRepository: CharacterMythicPlusAddonFallbackRepository = new CharacterMythicPlusAddonFallbackRepository()
  ) {}

  async getAuthoritativeMythicPlusMap(
    characterIds: string[]
  ): Promise<Map<string, AuthoritativeMythicPlusResult>> {
    const entries = await Promise.all(
      characterIds.map(
        async (characterId) =>
          [characterId, await this.getAuthoritativeMythicPlus(characterId)] as const
      )
    );

    return new Map(entries);
  }

  async getAuthoritativeMythicPlus(
    characterId: string
  ): Promise<AuthoritativeMythicPlusResult> {
    const snapshot =
      await this.snapshotRepository.findOne<NormalizedBlizzardMythicPlusPayload>(
        characterId,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_MYTHIC_PLUS
      );

    const hasSuccessfulSnapshot =
      snapshot !== null &&
      snapshot.payload !== null &&
      snapshot.fetchedAt !== null;

    if (hasSuccessfulSnapshot) {
      const isStale =
        Date.now() - snapshot.fetchedAt!.getTime() >
        BLIZZARD_MYTHIC_PLUS_STALE_THRESHOLD_MS;

      if (!isStale && snapshot.payload!.hasProfile) {
        return this.toBlizzardResult(snapshot.payload!, snapshot.fetchedAt!, false);
      }
    }

    const addonRating =
      await this.addonFallbackRepository.findSeasonRating(characterId);

    if (addonRating !== null) {
      return {
        source: "ADDON",
        rating: addonRating,
        hasProfile: false,
        bestRuns: [],
        periodId: null,
        fetchedAt: null,
        isStale: false
      };
    }

    // No ADDON value either - a stale/no-profile Blizzard snapshot still
    // beats nothing, but callers can see isStale/hasProfile and decide.
    if (hasSuccessfulSnapshot) {
      const isStale =
        Date.now() - snapshot!.fetchedAt!.getTime() >
        BLIZZARD_MYTHIC_PLUS_STALE_THRESHOLD_MS;

      return this.toBlizzardResult(snapshot!.payload!, snapshot!.fetchedAt!, isStale);
    }

    return {
      source: "NONE",
      rating: null,
      hasProfile: false,
      bestRuns: [],
      periodId: null,
      fetchedAt: null,
      isStale: false
    };
  }

  private toBlizzardResult(
    payload: NormalizedBlizzardMythicPlusPayload,
    fetchedAt: Date,
    isStale: boolean
  ): AuthoritativeMythicPlusResult {
    // Optional chaining guards against a legacy-shaped snapshot row
    // written before Phase D.2 introduced the nested currentPeriod/season
    // structure - falls back to "no current-period evidence yet" rather
    // than throwing, until the next refresh overwrites it.
    return {
      source: "BLIZZARD",
      rating: payload.rating,
      hasProfile: payload.hasProfile,
      bestRuns: payload.hasProfile ? (payload.currentPeriod?.bestRuns ?? []) : [],
      periodId: payload.currentPeriod?.periodId ?? null,
      fetchedAt,
      isStale
    };
  }
}
