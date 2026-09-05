import { CharacterExternalSnapshotRepository } from "../../../my-syntrack/api/character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfessionAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profession-authority.service.js";
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

    const effectiveSkillByCharacterId =
      await resolveEffectivePublicSkillByCharacterId(
        crafters,
        profession.key,
        profession.name,
        this.professionAuthorityService
      );

    return mapProfessionDetail(
      profession,
      effectiveSkillByCharacterId
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

    const effectiveSkillByCharacterId =
      await resolveEffectivePublicSkillByCharacterId(
        crafters,
        profession.key,
        profession.name,
        this.professionAuthorityService
      );

    return mapProfessionRecipeCatalog(
      profession,
      effectiveSkillByCharacterId
    );
  }
}