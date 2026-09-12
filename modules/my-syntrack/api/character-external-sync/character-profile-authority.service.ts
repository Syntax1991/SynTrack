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
 *
 * Phase F1 corrective review (2nd pass): an earlier version of this
 * service also compared Blizzard's `last_login_timestamp` against the
 * addon's own sync time, treating a newer addon sync as proof Blizzard's
 * snapshot was behind. That was removed - `last_login_timestamp` only
 * attests to when the character logged in, not to when Blizzard's
 * Profile resource was last refreshed, so the comparison could easily be
 * wrong in either direction. No real level/class failure case was found
 * that this guard fixed, so this stays the simpler, proven
 * BLIZZARD-primary/ADDON-fallback policy, gated only by fetch-age
 * staleness.
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

      /*
       * level/class have a real fallback (the Character row itself,
       * updated by the addon/manual/BattleNet-import paths) - once the
       * snapshot goes stale, prefer that over a possibly-outdated
       * Blizzard value, matching Equipment's "stale + fallback exists ->
       * use fallback" rule. race/faction/spec/guild/item-level have no
       * such fallback, so they keep coming from the stale snapshot
       * regardless (isStale below tells the caller to treat them with
       * that caveat) - matching Equipment's "stale + no fallback -> still
       * serve the stale value" rule.
       */
      return {
        source: "BLIZZARD",
        fetchedAt: snapshot.fetchedAt!,
        isStale,
        name: character.name,
        realm: character.realm,
        region: character.region,
        level: isStale ? character.level : (payload.level ?? character.level),
        class: isStale
          ? character.className
          : (payload.className ?? character.className),
        race: payload.raceName,
        faction: payload.faction,
        activeSpec: payload.activeSpecName,
        guild: payload.guildName
          ? { name: payload.guildName, realmSlug: payload.guildRealmSlug }
          : null,
        averageItemLevel: payload.averageItemLevel,
        equippedItemLevel: payload.equippedItemLevel
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
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null
    };
  }
}
