import { env } from "../../../../../apps/api/src/config/env.js";
import { mapWithConcurrency } from "../../../../../apps/api/src/shared/async/mapWithConcurrency.js";
import { AppError } from "../../../../../apps/api/src/shared/errors/AppError.js";
import { CharacterRepository } from "../../../../my-syntrack/api/characters/character.repository.js";
import { RemovedCharacterRepository } from "../../../../my-syntrack/api/characters/removed-character.repository.js";
import { ProfessionRepository } from "../../../../professions/api/profession.repository.js";
import type { RaiderAccessTokenGuard } from "../../raider-auth/raider-auth.types.js";
import { BattleNetClient } from "./battlenet.client.js";
import {
  createBattleNetCharacterKey,
  createBattleNetProfessionAssignments,
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

    private readonly professionRepository:
      ProfessionRepository,

    private readonly raiderAuth:
      RaiderAccessTokenGuard
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

    const professionIdByKey =
      await this.createProfessionIdMap();

    const outcomes =
      await mapWithConcurrency(
        selectedCharacters,
        importConcurrency,
        async (character) =>
          this.importCharacter(
            character,
            accessToken,
            professionIdByKey,
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
    accessToken: string,
    professionIdByKey:
      Map<string, string>,
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

      const professionData =
        await this.client
          .getCharacterProfessions(
            accessToken,
            character.realmSlug,
            character.name
          );

      const professionAssignments =
        createBattleNetProfessionAssignments(
          professionData,
          professionIdByKey
        );

      await this.characterRepository
        .upsertFromBattleNet({
          ...character,
          region:
            env.BATTLENET_REGION,
          professions:
            professionAssignments
        });

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

  private async createProfessionIdMap():
    Promise<Map<string, string>> {
    const professions =
      await this.professionRepository
        .findAll();

    return new Map(
      professions.map(
        (profession) => [
          profession.key,
          profession.id
        ]
      )
    );
  }

}