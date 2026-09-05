import { slugifyRealmName } from "../../../guild/api/audit/audit.realm-slug.js";
import { mapWithConcurrency } from "../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import type { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import type { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { normalizeBlizzardProfessions } from "./blizzard-professions.normalizer.js";
import type { CharacterEquipmentLookup, RefreshableCharacter } from "./character-equipment-refresh.service.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_PROFESSIONS,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type { ProfessionsRefreshOutcome, ProfessionsRefreshSummary } from "./character-external-sync.types.js";

const refreshConcurrency = 4;

/*
 * Same public-API-only guarantee as Equipment/Profile: no RaiderAuthService/
 * RaiderAccount dependency anywhere in this class. This pipeline NEVER
 * writes to CharacterProfession - it only persists a BLIZZARD/PROFESSIONS
 * snapshot. Knowledge Points, specialization nodes, weekly/Treatise/
 * Treasure state, and crafting simulation are never read, written, or
 * even referenced here - see CharacterProfessionAuthorityService for how
 * the two sources are merged for reads without ever touching the addon's
 * own rows.
 */
export class CharacterProfessionRefreshService {
  constructor(
    private readonly appTokenService: BattleNetAppTokenService,
    private readonly battleNetClient: BattleNetClient,
    private readonly snapshotRepository: CharacterExternalSnapshotRepository,
    private readonly characterLookup: CharacterEquipmentLookup
  ) {}

  async refreshCharacter(
    characterId: string
  ): Promise<ProfessionsRefreshOutcome> {
    const character = await this.characterLookup.findById(characterId);

    if (!character) {
      return { status: "NOT_FOUND", characterId };
    }

    return this.refreshOne(character);
  }

  async refreshAllEligible(): Promise<ProfessionsRefreshSummary> {
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
  ): Promise<ProfessionsRefreshOutcome> {
    const realmSlug = character.realmSlug ?? slugifyRealmName(character.realm);

    try {
      const accessToken = await this.appTokenService.getAccessToken();

      /*
       * getCharacterProfessions() already resolves an unknown character to
       * an empty {primaries:[],secondaries:[]} rather than null (its
       * existing 404 contract, unlike getCharacterEquipment/getCharacterProfile)
       * - a real character with zero primary professions and an unknown
       * character both look identical at this layer, so there is no
       * separate "not found" branch to handle here; either way the
       * result is a valid (possibly empty) success.
       */
      const response = await this.battleNetClient.getCharacterProfessions(
        accessToken,
        realmSlug,
        character.name
      );

      const payload = normalizeBlizzardProfessions(response);

      await this.snapshotRepository.recordSuccess(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_PROFESSIONS,
        payload
      );

      return {
        status: "SUCCESS",
        characterId: character.id,
        professionCount: payload.professions.length
      };
    }
    catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error refreshing professions from Blizzard.";

      await this.snapshotRepository.recordFailure(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_PROFESSIONS,
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
