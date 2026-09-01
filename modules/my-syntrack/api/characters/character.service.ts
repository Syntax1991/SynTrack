import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { ProfessionRepository } from "../../../professions/api/profession.repository.js";
import { CharacterRepository } from "./character.repository.js";
import type { CharacterInput } from "./character.types.js";
import { RemovedCharacterRepository } from "./removed-character.repository.js";

export class CharacterService {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly professionRepository: ProfessionRepository,
    private readonly removedCharacterRepository = new RemovedCharacterRepository()
  ) {}

  list() {
    return this.characterRepository.findAll();
  }

  listRemoved(raiderAccountId: string) {
    return this.removedCharacterRepository.listForAccount(raiderAccountId);
  }

  async create(input: CharacterInput, raiderAccountId?: string) {
    const normalizedInput = this.normalize(input);

    await this.validateProfessionIds(normalizedInput.professionIds);

    if (raiderAccountId) {
      const suppressed =
        await this.removedCharacterRepository.isSuppressed(raiderAccountId, {
          name: normalizedInput.name,
          realm: normalizedInput.realm,
          region: normalizedInput.region
        });

      if (suppressed) {
        await this.removedCharacterRepository.clearIdentityForAccount(
          raiderAccountId,
          {
            name: normalizedInput.name,
            realm: normalizedInput.realm,
            region: normalizedInput.region
          }
        );
      }
    }

    const existingCharacter = await this.characterRepository.findByIdentity(
      normalizedInput.name,
      normalizedInput.realm,
      normalizedInput.region
    );

    if (existingCharacter) {
      throw new AppError(
        409,
        "Ein Charakter mit diesem Namen, Realm und dieser Region existiert bereits."
      );
    }

    return this.characterRepository.create(normalizedInput);
  }

  async update(characterId: string, input: CharacterInput) {
    const currentCharacter =
      await this.characterRepository.findById(characterId);

    if (!currentCharacter) {
      throw new AppError(404, "Charakter nicht gefunden.");
    }

    const normalizedInput = this.normalize(input);

    await this.validateProfessionIds(normalizedInput.professionIds);

    const duplicate = await this.characterRepository.findByIdentity(
      normalizedInput.name,
      normalizedInput.realm,
      normalizedInput.region
    );

    if (duplicate && duplicate.id !== characterId) {
      throw new AppError(
        409,
        "Ein anderer Charakter verwendet bereits diese Identität."
      );
    }

    return this.characterRepository.update(characterId, normalizedInput);
  }

  /**
   * Safe removal: upsert account-scoped suppression, then delete Character
   * (child rows cascade via schema). Never deletes Character before
   * suppression is written.
   */
  async remove(characterId: string, raiderAccountId: string): Promise<void> {
    const character = await this.characterRepository.findById(characterId);

    if (!character || character.raiderAccountId !== raiderAccountId) {
      throw new AppError(404, "Charakter nicht gefunden.");
    }

    await prisma.$transaction(async (transaction) => {
      await this.removedCharacterRepository.upsertSuppression(
        raiderAccountId,
        {
          name: character.name,
          realm: character.realm,
          region: character.region,
          battleNetId: character.battleNetId
        },
        transaction
      );

      await transaction.character.delete({
        where: { id: characterId }
      });
    });
  }

  async restore(
    removedId: string,
    raiderAccountId: string
  ): Promise<{ restored: true; message: string }> {
    const count =
      await this.removedCharacterRepository.deleteByIdForAccount(
        removedId,
        raiderAccountId
      );

    if (count === 0) {
      throw new AppError(404, "Charakter nicht gefunden.");
    }

    return {
      restored: true,
      message: "Character will return after the next WoW sync."
    };
  }

  private normalize(input: CharacterInput): CharacterInput {
    return {
      ...input,
      name: input.name.trim(),
      realm: input.realm.trim(),
      region: input.region.toLowerCase(),
      className: input.className.trim(),
      professionIds: [...new Set(input.professionIds)]
    };
  }

  private async validateProfessionIds(professionIds: string[]) {
    if (professionIds.length > 2) {
      throw new AppError(
        400,
        "Ein Charakter kann maximal zwei Primärberufe besitzen."
      );
    }

    const professionCount =
      await this.professionRepository.countByIds(professionIds);

    if (professionCount !== professionIds.length) {
      throw new AppError(
        400,
        "Mindestens eine Berufs-ID ist ungültig."
      );
    }
  }
}
