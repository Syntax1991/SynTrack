import { env } from "../../../../../apps/api/src/config/env.js";
import { mapWithConcurrency } from "../../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { CharacterRepository } from "../../../../my-syntrack/api/characters/character.repository.js";
import { RemovedCharacterRepository } from "../../../../my-syntrack/api/characters/removed-character.repository.js";
import type { CharacterProfileRefreshService } from "../../../../my-syntrack/api/character-external-sync/character-profile-refresh.service.js";
import type { CharacterProfessionRefreshService } from "../../../../my-syntrack/api/character-external-sync/character-profession-refresh.service.js";
import type { CharacterMythicPlusRefreshService } from "../../../../my-syntrack/api/character-external-sync/character-mythic-plus-refresh.service.js";
import type { CharacterAchievementsRefreshService } from "../../../../my-syntrack/api/character-external-sync/character-achievements-refresh.service.js";
import type { RaiderAccessTokenGuard } from "../../raider-auth/raider-auth.types.js";
import type { BattleNetAppTokenService } from "./battlenet-app-token.service.js";
import { BattleNetClient } from "./battlenet.client.js";
import {
  createBattleNetCharacterKey,
  normalizeBattleNetCharacters,
  type ImportableBattleNetCharacter
} from "./battlenet-import.mapper.js";
import type {
  BattleNetCharacterPreviewResult,
  BattleNetImportFailure,
  BattleNetImportResult
} from "./battlenet.types.js";

const importConcurrency = 4;

type ImportOutcome = {
  imported: boolean;
  failure: BattleNetImportFailure | null;
};

export class BattleNetImportService {
  private readonly removedCharacterRepository =
    new RemovedCharacterRepository();

  constructor(
    private readonly client:
      BattleNetClient,

    private readonly characterRepository:
      CharacterRepository,

    /*
     * Only ever used for /profile/user/wow (account character discovery)
     * - the one endpoint Phase 0 confirmed genuinely requires a user
     * token. Every other Blizzard call this service makes uses the app
     * token below.
     */
    private readonly raiderAuth:
      RaiderAccessTokenGuard,

    private readonly appTokenService:
      BattleNetAppTokenService,

    private readonly profileRefreshService:
      CharacterProfileRefreshService,

    private readonly professionRefreshService:
      CharacterProfessionRefreshService,

    private readonly mythicPlusRefreshService:
      CharacterMythicPlusRefreshService,

    private readonly achievementsRefreshService:
      CharacterAchievementsRefreshService
  ) {}

  async listCharacters(
    token: string
  ): Promise<BattleNetCharacterPreviewResult> {
    const { accessToken } =
      await this.raiderAuth.requireUsableAccessToken(
        token
      );

    const accountProfile =
      await this.client.getAccountProfile(
        accessToken
      );

    const characters =
      normalizeBattleNetCharacters(
        accountProfile
      );

    const importedIdentities =
      await this.characterRepository
        .findBattleNetIdentities(
          env.BATTLENET_REGION
        );

    const importedKeys =
      new Set<string>();

    for (
      const identity of
      importedIdentities
    ) {
      if (
        identity.battleNetId &&
        identity.realmSlug
      ) {
        importedKeys.add(
          createBattleNetCharacterKey({
            battleNetId:
              identity.battleNetId,
            realmSlug:
              identity.realmSlug
          })
        );
      }
    }

    const items = characters
      .map((character) => {
        const key =
          createBattleNetCharacterKey(
            character
          );

        return {
          key,
          ...character,
          imported:
            importedKeys.has(key)
        };
      })
      .sort(
        (left, right) =>
          right.level - left.level ||
          left.realm.localeCompare(
            right.realm,
            "de"
          ) ||
          left.name.localeCompare(
            right.name,
            "de"
          )
      );

    return {
      items,
      totalCharacters:
        items.length,
      defaultMinimumLevel:
        env.CRAFTING_MIN_LEVEL
    };
  }

  async importCharacters(
    token: string,
    characterKeys: string[]
  ): Promise<BattleNetImportResult> {
    const { accessToken, raiderAccountId } =
      await this.raiderAuth.requireUsableAccessToken(
        token
      );

    const accountProfile =
      await this.client.getAccountProfile(
        accessToken
      );

    const availableCharacters =
      normalizeBattleNetCharacters(
        accountProfile
      );

    const requestedKeys =
      new Set(characterKeys);

    const selectedCharacters =
      availableCharacters.filter(
        (character) =>
          requestedKeys.has(
            createBattleNetCharacterKey(
              character
            )
          )
      );

    if (
      selectedCharacters.length !==
      requestedKeys.size
    ) {
      throw new AppError(
        400,
        "Mindestens ein ausgewählter Charakter ist im Battle.net-Konto nicht mehr verfügbar."
      );
    }

    const outcomes =
      await mapWithConcurrency(
        selectedCharacters,
        importConcurrency,
        async (character) =>
          this.importCharacter(
            character,
            raiderAccountId
          )
      );

    return {
      totalCharacters:
        selectedCharacters.length,
      importedCharacters:
        outcomes.filter(
          (outcome) =>
            outcome.imported
        ).length,
      failedCharacters:
        outcomes
          .map(
            (outcome) =>
              outcome.failure
          )
          .filter(
            (
              failure
            ): failure is BattleNetImportFailure =>
              failure !== null
          )
    };
  }

  private async importCharacter(
    character:
      ImportableBattleNetCharacter,
    raiderAccountId: string
  ): Promise<ImportOutcome> {
    try {
      const suppressed =
        await this.removedCharacterRepository.isSuppressed(
          raiderAccountId,
          {
            name: character.name,
            realm: character.realm,
            region: env.BATTLENET_REGION,
            battleNetId: character.battleNetId
          }
        );

      if (suppressed) {
        return {
          imported: false,
          failure: null
        };
      }

      /*
       * Identity only here - no professions payload at all. Public
       * profession enrichment (learned profession/tier/skill/max-skill)
       * goes through the same app-token PROFESSIONS refresh pipeline as
       * a manual refresh, below, instead of writing directly into
       * CharacterProfession here. The old path
       * (getCharacterProfessions + a direct upsertFromBattleNet
       * professions[] write) used to unconditionally overwrite
       * knowledgePoints with a hardcoded 0 on every re-import, silently
       * zeroing real addon-captured Knowledge Points - this removes that
       * write path entirely rather than trying to patch it, since
       * Knowledge Points must never be touched by anything Blizzard-
       * sourced (see CharacterProfessionAuthorityService).
       */
      const savedCharacter =
        await this.characterRepository
          .upsertFromBattleNet({
            ...character,
            region:
              env.BATTLENET_REGION,
            professions: []
          });

      /*
       * Public profile/profession enrichment uses the same app-token
       * refresh pipelines as a manual refresh. Both already catch
       * Blizzard-side failures internally and never throw for them -
       * these try/catches are an extra guard so that even a genuinely
       * unexpected error here can never turn an already-successful
       * import into a reported failure; the character is tracked
       * regardless of whether either enrichment step succeeds.
       */
      try {
        await this.profileRefreshService.refreshCharacter(
          savedCharacter.id
        );
      }
      catch {
        // Non-fatal by design - see comment above.
      }

      try {
        await this.professionRefreshService.refreshCharacter(
          savedCharacter.id
        );
      }
      catch {
        // Non-fatal by design - see comment above.
      }

      try {
        await this.mythicPlusRefreshService.refreshCharacter(
          savedCharacter.id
        );
      }
      catch {
        // Non-fatal by design - see comment above.
      }

      try {
        await this.achievementsRefreshService.refreshCharacter(
          savedCharacter.id
        );
      }
      catch {
        // Non-fatal by design - see comment above.
      }

      return {
        imported: true,
        failure: null
      };
    }
    catch (error) {
      if (
        error instanceof AppError &&
        error.statusCode === 401
      ) {
        throw error;
      }

      return {
        imported: false,
        failure: {
          name:
            character.name,
          realm:
            character.realm,
          error:
            error instanceof Error
              ? error.message
              : "Unbekannter Importfehler"
        }
      };
    }
  }

}