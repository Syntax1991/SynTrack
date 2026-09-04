import { slugifyRealmName } from "../../../guild/api/audit/audit.realm-slug.js";
import { mapWithConcurrency } from "../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import type { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import type { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { normalizeBlizzardProfile } from "./blizzard-profile.normalizer.js";
import type { CharacterEquipmentLookup, RefreshableCharacter } from "./character-equipment-refresh.service.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_PROFILE,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type { ProfileRefreshOutcome, ProfileRefreshSummary } from "./character-external-sync.types.js";

const refreshConcurrency = 4;

/*
 * Same PUBLIC-API-only guarantee as CharacterEquipmentRefreshService (see
 * Phase A): no RaiderAuthService/RaiderAccount dependency anywhere in this
 * class. Reuses the exact same character lookup shape/repository - a
 * character eligible for equipment refresh is eligible for profile
 * refresh too (same region/realm/name requirement, nothing more).
 */
export class CharacterProfileRefreshService {
  constructor(
    private readonly appTokenService: BattleNetAppTokenService,
    private readonly battleNetClient: BattleNetClient,
    private readonly snapshotRepository: CharacterExternalSnapshotRepository,
    private readonly characterLookup: CharacterEquipmentLookup
  ) {}

  async refreshCharacter(characterId: string): Promise<ProfileRefreshOutcome> {
    const character = await this.characterLookup.findById(characterId);

    if (!character) {
      return { status: "NOT_FOUND", characterId };
    }

    return this.refreshOne(character);
  }

  async refreshAllEligible(): Promise<ProfileRefreshSummary> {
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
  ): Promise<ProfileRefreshOutcome> {
    const realmSlug = character.realmSlug ?? slugifyRealmName(character.realm);

    try {
      const accessToken = await this.appTokenService.getAccessToken();

      const profile = await this.battleNetClient.getCharacterProfile(
        accessToken,
        realmSlug,
        character.name
      );

      if (!profile) {
        await this.snapshotRepository.recordFailure(
          character.id,
          EXTERNAL_SOURCE_BLIZZARD,
          EXTERNAL_DOMAIN_PROFILE,
          "Character not found on Blizzard's Character Profile API (404)."
        );

        return {
          status: "FAILED",
          characterId: character.id,
          reason: "not_found"
        };
      }

      const payload = normalizeBlizzardProfile(profile, {
        requestedName: character.name,
        requestedRealm: character.realm
      });

      await this.snapshotRepository.recordSuccess(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_PROFILE,
        payload
      );

      return {
        status: "SUCCESS",
        characterId: character.id,
        identityMismatch: payload.identityMismatch
      };
    }
    catch (error) {
      // Same non-destructive contract as equipment refresh: never persist
      // the raw error/response, only a short safe message, and never let
      // this throw further - one character's failure must never affect
      // another (mapWithConcurrency already isolates each call's own
      // try/catch).
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error refreshing profile from Blizzard.";

      await this.snapshotRepository.recordFailure(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_PROFILE,
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
