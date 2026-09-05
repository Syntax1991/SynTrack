import { isBlizzardObservationBehindAddon } from "./character-blizzard-recency.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_PROFILE,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type {
  AuthoritativeProfileResult,
  NormalizedBlizzardProfilePayload
} from "./character-external-sync.types.js";

/*
 * Profile facts (class/race/faction/spec/guild) change far less often
 * than equipment - the original data-architecture audit classified
 * "character class/race" as "rarely changes", distinct from equipment's
 * "moderate" volatility. A longer staleness threshold than the 24h used
 * for EQUIPMENT is deliberate, not copy-pasted.
 */
const BLIZZARD_PROFILE_STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export type CharacterIdentityRow = {
  name: string;
  realm: string;
  region: string;
  level: number;
  className: string;
  /**
   * When the addon itself last synced this character's core row -
   * compared against Blizzard's own `last_login_timestamp` (Phase F1
   * corrective review's recency guard) so a newer addon observation
   * isn't silently overridden by a Blizzard snapshot that hasn't caught
   * up to a more recent login yet. Optional so callers that cannot
   * supply it degrade to the pre-existing fetchedAt-only staleness
   * check rather than being forced to widen their own queries.
   */
  lastSyncedAt?: Date | null;
};

/*
 * Category A (SynTrack's own tracking identity: name/realm/region) is
 * ALWAYS read from the Character row, never from Blizzard - see Phase B's
 * "NAME/REALM REQUIRE SPECIAL CARE" rule. Category B (public facts: level/
 * class/race/faction/spec/guild/item level) prefers a fresh Blizzard
 * snapshot, falling back to the Character row's own level/class (the only
 * two of those fields the existing model already stores) when no snapshot
 * exists or it's gone stale - the same provider-authority-over-freshness
 * rule as the Equipment domain.
 */
export class CharacterProfileAuthorityService {
  constructor(
    private readonly snapshotRepository: CharacterExternalSnapshotRepository
  ) {}

  async getAuthoritativeProfile(
    characterId: string,
    character: CharacterIdentityRow
  ): Promise<AuthoritativeProfileResult> {
    const snapshot =
      await this.snapshotRepository.findOne<NormalizedBlizzardProfilePayload>(
        characterId,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_PROFILE
      );

    const hasSuccessfulSnapshot =
      snapshot !== null &&
      snapshot.payload !== null &&
      snapshot.fetchedAt !== null;

    if (hasSuccessfulSnapshot) {
      const isStale =
        Date.now() - snapshot.fetchedAt!.getTime() >
        BLIZZARD_PROFILE_STALE_THRESHOLD_MS;

      const payload = snapshot.payload!;
      const lastLoginAt =
        payload.lastLoginTimestamp !== null
          ? new Date(payload.lastLoginTimestamp)
          : null;

      /*
       * Recency guard (Phase F1 corrective review): fetchedAt-based
       * `isStale` only proves SynTrack polled Blizzard within the
       * threshold - it says nothing about whether the addon has since
       * observed a newer login than the one Blizzard's snapshot
       * reflects. When it has, level/class fall back to the addon-
       * synced Character row exactly as they already do when the
       * snapshot itself is stale - the two checks are independent axes
       * of "can this Blizzard value be trusted right now".
       */
      const blizzardBehindAddon = isBlizzardObservationBehindAddon(
        lastLoginAt,
        character.lastSyncedAt ?? null
      );
      const useAddonFallbackForPublicFacts = isStale || blizzardBehindAddon;

      /*
       * level/class have a real fallback (the Character row itself,
       * updated by the addon/manual/BattleNet-import paths) - once the
       * snapshot goes stale OR the addon has observed a newer login
       * than Blizzard's, prefer that over a possibly-outdated Blizzard
       * value, matching Equipment's "stale + fallback exists -> use
       * fallback" rule. race/faction/spec/guild/item-level have no such
       * fallback, so they keep coming from the snapshot regardless
       * (isStale below tells the caller to treat them with that
       * caveat) - matching Equipment's "stale + no fallback -> still
       * serve the stale value" rule.
       */
      return {
        source: "BLIZZARD",
        fetchedAt: snapshot.fetchedAt!,
        isStale,
        name: character.name,
        realm: character.realm,
        region: character.region,
        level: useAddonFallbackForPublicFacts
          ? character.level
          : (payload.level ?? character.level),
        class: useAddonFallbackForPublicFacts
          ? character.className
          : (payload.className ?? character.className),
        race: payload.raceName,
        faction: payload.faction,
        activeSpec: payload.activeSpecName,
        guild: payload.guildName
          ? { name: payload.guildName, realmSlug: payload.guildRealmSlug }
          : null,
        averageItemLevel: payload.averageItemLevel,
        equippedItemLevel: payload.equippedItemLevel,
        lastLoginAt
      };
    }

    return {
      source: "NONE",
      fetchedAt: null,
      isStale: false,
      name: character.name,
      realm: character.realm,
      region: character.region,
      level: character.level,
      class: character.className,
      lastLoginAt: null,
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null
    };
  }

  /*
   * Cheap, batched access to just Blizzard's last-login evidence -
   * reused by Equipment/Mythic+'s own recency guards (Phase F1
   * corrective review) without pulling in this service's full level/
   * class/race resolution, which those domains have no use for.
   */
  async getLastLoginAtMap(
    characterIds: string[]
  ): Promise<Map<string, Date | null>> {
    const entries = await Promise.all(
      characterIds.map(async (characterId) => {
        const snapshot =
          await this.snapshotRepository.findOne<NormalizedBlizzardProfilePayload>(
            characterId,
            EXTERNAL_SOURCE_BLIZZARD,
            EXTERNAL_DOMAIN_PROFILE
          );

        const lastLoginTimestamp = snapshot?.payload?.lastLoginTimestamp ?? null;

        return [
          characterId,
          lastLoginTimestamp !== null ? new Date(lastLoginTimestamp) : null
        ] as const;
      })
    );

    return new Map(entries);
  }
}
