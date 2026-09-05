import { CharacterExternalSnapshotRepository } from "../../../my-syntrack/api/character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfessionAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profession-authority.service.js";
import { CharacterProfileAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profile-authority.service.js";
import { resolveEffectiveCharacterIdentities } from "../../../my-syntrack/api/character-external-sync/character-profile-effective-identity.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { mapProfessionDetail } from "./profession-detail.mapper.js";
import { ProfessionDetailRepository } from "./profession-detail.repository.js";
import { mapProfessionOverview } from "./profession-overview.mapper.js";
import { resolveEffectivePublicSkillByCharacterId } from "./profession-recipe-effective-skill.js";
import { mapProfessionRecipeCatalog } from "./profession-recipe.mapper.js";
import { ProfessionRecipeRepository } from "./profession-recipe.repository.js";

export class ProfessionDetailService {
  constructor(
    private readonly repository:
      ProfessionDetailRepository,

    private readonly recipeRepository:
      ProfessionRecipeRepository,

    private readonly professionAuthorityService = new CharacterProfessionAuthorityService(
      new CharacterExternalSnapshotRepository()
    ),

    private readonly profileAuthorityService = new CharacterProfileAuthorityService(
      new CharacterExternalSnapshotRepository()
    )
  ) {}

  async getOverview() {
    const professions =
      await this.repository.findOverview();

    return {
      items:
        mapProfessionOverview(
          professions
        )
    };
  }

  async getDetail(
    professionId: string
  ) {
    const profession =
      await this.repository.findById(
        professionId
      );

    if (!profession) {
      throw new AppError(
        404,
        "Beruf nicht gefunden."
      );
    }

    const crafters = profession.assignments.map(
      (assignment) => ({
        characterId: assignment.character.id,
        skill: assignment.skill
      })
    );

    // One effective-identity lookup per distinct character (a profession's
    // assignments already carry one row per character, but this stays
    // defensive rather than assuming that invariant).
    const distinctCharacters = new Map(
      profession.assignments.map((assignment) => [
        assignment.character.id,
        assignment.character
      ])
    );

    const [effectiveSkillByCharacterId, effectiveClassNameByCharacterId] =
      await Promise.all([
        resolveEffectivePublicSkillByCharacterId(
          crafters,
          profession.key,
          profession.name,
          this.professionAuthorityService
        ),
        this.resolveEffectiveClassNameByCharacterId(
          [...distinctCharacters.values()]
        )
      ]);

    return mapProfessionDetail(
      profession,
      effectiveSkillByCharacterId,
      effectiveClassNameByCharacterId
    );
  }

  async getRecipes(
    professionId: string
  ) {
    const profession =
      await this.recipeRepository
        .findByProfessionId(
          professionId
        );

    if (!profession) {
      throw new AppError(
        404,
        "Beruf nicht gefunden."
      );
    }

    const crafters = profession.recipes.flatMap(
      (recipe) =>
        recipe.characters.map((relation) => ({
          characterId: relation.characterProfession.character.id,
          skill: relation.characterProfession.skill
        }))
    );

    // One effective-identity lookup per distinct character across every
    // recipe/crafter row, not per crafter.
    const distinctCharacters = new Map(
      profession.recipes.flatMap((recipe) =>
        recipe.characters.map((relation) => [
          relation.characterProfession.character.id,
          relation.characterProfession.character
        ] as const)
      )
    );

    const [effectiveSkillByCharacterId, effectiveClassNameByCharacterId] =
      await Promise.all([
        resolveEffectivePublicSkillByCharacterId(
          crafters,
          profession.key,
          profession.name,
          this.professionAuthorityService
        ),
        this.resolveEffectiveClassNameByCharacterId(
          [...distinctCharacters.values()]
        )
      ]);

    return mapProfessionRecipeCatalog(
      profession,
      effectiveSkillByCharacterId,
      effectiveClassNameByCharacterId
    );
  }

  private async resolveEffectiveClassNameByCharacterId(
    characters: Parameters<typeof resolveEffectiveCharacterIdentities>[0]
  ): Promise<Map<string, string>> {
    const identityByCharacterId = await resolveEffectiveCharacterIdentities(
      characters,
      this.profileAuthorityService
    );

    return new Map(
      [...identityByCharacterId.entries()].map(([characterId, identity]) => [
        characterId,
        identity.className
      ])
    );
  }
}