import { slugifyRealmName } from "../../../guild/api/audit/audit.realm-slug.js";
import { mapWithConcurrency } from "../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import type { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import type { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { watchedSeasonAchievementIds } from "../season-checklist/season-evidence-catalog.js";
import { normalizeBlizzardAchievements } from "./blizzard-achievements.normalizer.js";
import type { CharacterEquipmentLookup, RefreshableCharacter } from "./character-equipment-refresh.service.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_ACHIEVEMENTS,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type { AchievementsRefreshOutcome, AchievementsRefreshSummary } from "./character-achievements-sync.types.js";

const refreshConcurrency = 4;
const watchedAchievementIds = new Set(watchedSeasonAchievementIds());

/*
 * Same public-API-only guarantee as Equipment/Profile/Professions/
 * Mythic+: no RaiderAuthService/RaiderAccount dependency anywhere in
 * this class, and this pipeline never touches any quest-flag/weekly/
 * Vault/profession model - it only persists a BLIZZARD/ACHIEVEMENTS
 * snapshot. Cracked Keystone (quest-based) and every other non-
 * achievement Season evidence type are structurally untouched (there is
 * no quest id anywhere in this file).
 */
export class CharacterAchievementsRefreshService {
  constructor(
    private readonly appTokenService: BattleNetAppTokenService,
    private readonly battleNetClient: BattleNetClient,
    private readonly snapshotRepository: CharacterExternalSnapshotRepository,
    private readonly characterLookup: CharacterEquipmentLookup
  ) {}

  async refreshCharacter(
    characterId: string
  ): Promise<AchievementsRefreshOutcome> {
    const character = await this.characterLookup.findById(characterId);

    if (!character) {
      return { status: "NOT_FOUND", characterId };
    }

    return this.refreshOne(character);
  }

  async refreshAllEligible(): Promise<AchievementsRefreshSummary> {
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
  ): Promise<AchievementsRefreshOutcome> {
    const realmSlug = character.realmSlug ?? slugifyRealmName(character.realm);

    try {
      const accessToken = await this.appTokenService.getAccessToken();

      /*
       * null here means Blizzard cleanly confirmed no achievements
       * profile exists (a real 404) - normalized to an empty watched
       * list, the same "genuine no-data, not a failure" contract used
       * by the Equipment/Profile/Mythic+ pipelines.
       */
      const response = await this.battleNetClient.getCharacterAchievements(
        accessToken,
        realmSlug,
        character.name
      );

      const payload = normalizeBlizzardAchievements(
        response,
        watchedAchievementIds
      );

      await this.snapshotRepository.recordSuccess(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_ACHIEVEMENTS,
        payload
      );

      return {
        status: "SUCCESS",
        characterId: character.id,
        watchedAchievementCount: payload.achievements.length
      };
    }
    catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error refreshing achievements from Blizzard.";

      await this.snapshotRepository.recordFailure(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_ACHIEVEMENTS,
        message
      );

      return {
        status: "FAILED",
        characterId: character.id,
        reason: message
      };
    }
  }
}
