import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { ProfessionRepository } from "../../../professions/api/profession.repository.js";
import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import { CharacterMythicPlusAuthorityService } from "../character-external-sync/character-mythic-plus-authority.service.js";
import { CharacterExternalSnapshotRepository } from "../character-external-sync/character-external-snapshot.repository.js";
import { CharacterRepository } from "./character.repository.js";
import type { CharacterInput } from "./character.types.js";
import { RemovedCharacterRepository } from "./removed-character.repository.js";

export class CharacterService {
  constructor(
    private readonly characterRepository: CharacterRepository,
    private readonly professionRepository: ProfessionRepository,
    private readonly removedCharacterRepository = new RemovedCharacterRepository(),
    private readonly profileAuthorityService = new CharacterProfileAuthorityService(
      new CharacterExternalSnapshotRepository()
    ),
    private readonly professionAuthorityService = new CharacterProfessionAuthorityService(
      new CharacterExternalSnapshotRepository()
    ),
    private readonly mythicPlusAuthorityService = new CharacterMythicPlusAuthorityService(
      new CharacterExternalSnapshotRepository()
    )
  ) {}

  /*
   * Additive read-path integration (Phase B7/C9/D10): each character gets
   * an extra `profile` field (race/faction/spec/guild/item level), an
   * `authoritativeProfessions` field (learned profession/tier/skill/max-
   * skill, source per entry), and an `authoritativeMythicPlus` field
   * (PUBLIC/SEASONAL rating + current-period best runs, source per
   * result) with whatever Blizzard-authoritative public facts are
   * available - without touching name/realm identity, the existing
   * `professions` relation (still the addon's own CharacterProfession
   * rows, untouched), or any current-week Vault/Weeklies gameplay data
   * (permanently addon-only, see Phase D8's Great Vault firewall - this
   * service never imports the weekly-gameplay module).
   *
   * Phase F3: the rendered `level`/`className` now come from the same
   * `profile` object (BLIZZARD-primary/ADDON-fallback), overridden
   * in-memory only - the underlying Character row is never rewritten,
   * matching the pattern already established in
   * overview-profile-effective.ts.
   */
  async list() {
    const characters = await this.characterRepository.findAll();

    return Promise.all(
      characters.map(async (character) => {
        const profile = await this.profileAuthorityService.getAuthoritativeProfile(
          character.id,
          {
            name: character.name,
            realm: character.realm,
            region: character.region,
            level: character.level,
            className: character.className
          }
        );

        return {
          ...character,
          // Phase F3: the rendered level/className are the SAME
          // BLIZZARD-primary/ADDON-fallback value already computed just
          // above for `profile` - overridden here (not persisted) so the
          // Characters list stops rendering the raw, addon-only Character
          // row directly, matching Overview's established pattern.
          level: profile.level,
          className: profile.class,
          profile,
          authoritativeProfessions:
            await this.professionAuthorityService.getAuthoritativeProfessions(
              character.id,
              character.professions.map((assignment) => ({
                professionKey: assignment.profession.key,
                professionName: assignment.profession.name,
                skill: assignment.skill
              }))
            ),
          authoritativeMythicPlus:
            await this.mythicPlusAuthorityService.getAuthoritativeMythicPlus(
              character.id
            )
        };
      })
    );
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
