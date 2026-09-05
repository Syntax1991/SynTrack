import { slugifyRealmName } from "../../../guild/api/audit/audit.realm-slug.js";
import { mapWithConcurrency } from "../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import type { BattleNetAppTokenService } from "../../../data-platform/api/integrations/battlenet/battlenet-app-token.service.js";
import type { BattleNetClient } from "../../../data-platform/api/integrations/battlenet/battlenet.client.js";
import { normalizeBlizzardEquipment } from "./blizzard-equipment.normalizer.js";
import { CharacterExternalSnapshotRepository } from "./character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_EQUIPMENT,
  EXTERNAL_SOURCE_BLIZZARD
} from "./character-external-sync.types.js";
import type { EquipmentRefreshOutcome, EquipmentRefreshSummary } from "./character-external-sync.types.js";

const refreshConcurrency = 4;

export type RefreshableCharacter = {
  id: string;
  name: string;
  realm: string;
  realmSlug: string | null;
};

export type CharacterEquipmentLookup = {
  findById(characterId: string): Promise<RefreshableCharacter | null>;
  findAllEligible(): Promise<RefreshableCharacter[]>;
};

/*
 * Public Character Profile refresh MUST use the app's own
 * client_credentials token, never a logged-in officer/raider's
 * personal Battle.net session - see Phase 0's live capability test.
 * This class has no dependency on RaiderAuthService/RaiderAccount at
 * all, by construction, so it works identically whether or not anyone
 * is currently logged into Battle.net, whether a user's personal OAuth
 * token has expired, and regardless of how the character was
 * originally added (manual, addon, or Battle.net import) - as long as
 * SynTrack knows its region/realm/name.
 */
export class CharacterEquipmentRefreshService {
  constructor(
    private readonly appTokenService: BattleNetAppTokenService,
    private readonly battleNetClient: BattleNetClient,
    private readonly snapshotRepository: CharacterExternalSnapshotRepository,
    private readonly characterLookup: CharacterEquipmentLookup
  ) {}

  async refreshCharacter(
    characterId: string
  ): Promise<EquipmentRefreshOutcome> {
    const character = await this.characterLookup.findById(characterId);

    if (!character) {
      return { status: "NOT_FOUND", characterId };
    }

    return this.refreshOne(character);
  }

  async refreshAllEligible(): Promise<EquipmentRefreshSummary> {
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
  ): Promise<EquipmentRefreshOutcome> {
    const realmSlug = character.realmSlug ?? slugifyRealmName(character.realm);

    try {
      const accessToken = await this.appTokenService.getAccessToken();

      const equipment = await this.battleNetClient.getCharacterEquipment(
        accessToken,
        realmSlug,
        character.name
      );

      if (!equipment) {
        await this.snapshotRepository.recordFailure(
          character.id,
          EXTERNAL_SOURCE_BLIZZARD,
          EXTERNAL_DOMAIN_EQUIPMENT,
          "Character not found on Blizzard's Character Equipment API (404)."
        );

        return {
          status: "FAILED",
          characterId: character.id,
          reason: "not_found"
        };
      }

      const payload = normalizeBlizzardEquipment(equipment);

      await this.snapshotRepository.recordSuccess(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_EQUIPMENT,
        payload
      );

      return {
        status: "SUCCESS",
        characterId: character.id,
        slotCount: payload.slots.length,
        averageItemLevel: payload.averageItemLevel
      };
    }
    catch (error) {
      // Never persist the underlying error object (it may carry
      // request/response detail) - only a short, safe message. This
      // path covers timeouts, 401/403 app-token issues, 429 rate
      // limits, and 5xx Blizzard outages alike; none of them may ever
      // touch the last successful snapshot.
      const message =
        error instanceof Error
          ? error.message
          : "Unknown error refreshing equipment from Blizzard.";

      await this.snapshotRepository.recordFailure(
        character.id,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_EQUIPMENT,
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
