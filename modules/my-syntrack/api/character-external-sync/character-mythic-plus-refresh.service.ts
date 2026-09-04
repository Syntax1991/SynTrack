import { slugifyRealmName } from "../../../guild/api/audit/audit.realm-slug.js";
import { mapWithConcurrency } from "../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import type { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import type { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { normalizeBlizzardMythicPlus, resolveCurrentSeasonId } from "./blizzard-mythic-plus.normalizer.js";
import type { BattleNetMythicKeystoneSeasonProfile } from "../../../data-platform/api/integrations/battlenet/battlenet.types.js";
import type { CharacterEquipmentLookup, RefreshableCharacter } from "./character-equipment-refresh.service.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_MYTHIC_PLUS,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type { MythicPlusRefreshOutcome, MythicPlusRefreshSummary } from "./character-external-sync.types.js";

const refreshConcurrency = 4;

/*
 * Same public-API-only guarantee as Equipment/Profile/Professions: no
 * RaiderAuthService/RaiderAccount dependency anywhere in this class, and
 * this pipeline NEVER touches CharacterWeeklyGameplaySnapshot/
 * CharacterWeeklyVaultActivity/CharacterWeeklyMythicPlusCapture - it only
 * persists a BLIZZARD/MYTHIC_PLUS snapshot. Current-week Vault run
 * counts/progress stay permanently ADDON-only (Phase D8's Great Vault
 * firewall) - this class has no import of, or dependency on, the
 * weekly-gameplay module at all.
 */
export class CharacterMythicPlusRefreshService {
  constructor(
    private readonly appTokenService: BattleNetAppTokenService,
    private readonly battleNetClient: BattleNetClient,
    private readonly snapshotRepository: CharacterExternalSnapshotRepository,
    private readonly characterLookup: CharacterEquipmentLookup
  ) {}

  async refreshCharacter(
    characterId: string
  ): Promise<MythicPlusRefreshOutcome> {
    const character = await this.characterLookup.findById(characterId);

    if (!character) {
      return { status: "NOT_FOUND", characterId };
    }

    return this.refreshOne(character);
  }

  async refreshAllEligible(): Promise<MythicPlusRefreshSummary> {
    const characters = await this.characterLookup.findAllEligible();

    const results = await mapWithConcurrency(
      characters,
      refreshConcurrency,
      (character) => this.refreshOne(character)
    );

    return {
      totalCharacters: results.length,
      succeeded: results.filter((result) => result.status === "SUCCESS")
        .length,
      failed: results.filter((result) => result.status === "FAILED").length,
      results
    };
  }

  private async refreshOne(
    character: RefreshableCharacter
  ): Promise<MythicPlusRefreshOutcome> {
    const realmSlug = character.realmSlug ?? slugifyRealmName(character.realm);

    try {
      const accessToken = await this.appTokenService.getAccessToken();

      /*
       * null here means Blizzard cleanly confirmed no Mythic Keystone
       * profile exists (a real 404) - a genuine, intentional "no M+
       * activity" result, not a failure (Phase D7/D14). It is recorded as
       * a SUCCESSFUL snapshot with hasProfile:false, exactly like a real
       * profile with zero best runs would be, so fetchedAt still
       * advances and callers can tell "confirmed none" apart from
       * "never checked" or "check failed".
       */
      const response = await this.battleNetClient.getCharacterMythicKeystoneProfile(
        accessToken,
        realmSlug,
        character.name
      );

      const seasonResponse = await this.fetchSeasonProfile(
        accessToken,
        realmSlug,
        character.name,
        response
      );

      const payload = normalizeBlizzardMythicPlus(response, seasonResponse);

      await this.snapshotRepository.recordSuccess(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_MYTHIC_PLUS,
        payload
      );

      return {
        status: "SUCCESS",
        characterId: character.id,
        hasMythicPlusProfile: payload.hasProfile,
        currentPeriodBestRunCount: payload.currentPeriod.bestRuns.length,
        seasonBestRunCount: payload.season.bestRuns.length
      };
    }
    catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error refreshing Mythic+ data from Blizzard.";

      await this.snapshotRepository.recordFailure(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_MYTHIC_PLUS,
        message
      );

      return {
        status: "FAILED",
        characterId: character.id,
        reason: message
      };
    }
  }

  /*
   * Isolated on purpose: a season-endpoint failure must never discard a
   * successfully-fetched current_period profile (Phase D.1 observed this
   * specific endpoint family can be intermittently unavailable even when
   * sibling endpoints succeed). `profile === null` (no Mythic Keystone
   * profile at all) or no resolvable season id both short-circuit to no
   * season fetch at all, rather than a season/null lookup.
   */
  private async fetchSeasonProfile(
    accessToken: string,
    realmSlug: string,
    characterName: string,
    profile: Parameters<typeof normalizeBlizzardMythicPlus>[0]
  ): Promise<BattleNetMythicKeystoneSeasonProfile | null> {
    if (!profile) {
      return null;
    }

    const seasonId = resolveCurrentSeasonId(profile);

    if (seasonId === null) {
      return null;
    }

    try {
      return await this.battleNetClient.getCharacterMythicKeystoneProfileSeason(
        accessToken,
        realmSlug,
        characterName,
        seasonId
      );
    }
    catch {
      return null;
    }
  }
}
