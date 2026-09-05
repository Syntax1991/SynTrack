import { ProfessionDetailRepository } from "../../../professions/api/details/profession-detail.repository.js";
import { ProfessionDetailService } from "../../../professions/api/details/profession-detail.service.js";
import { ProfessionRecipeRepository } from "../../../professions/api/details/profession-recipe.repository.js";
import { CharacterExternalSnapshotRepository } from "../character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import { resolveEffectiveCharacterIdentities } from "../character-external-sync/character-profile-effective-identity.js";
import { ProfessionKnowledgeTreasureStatusRepository } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.repository.js";
import { ProfessionKnowledgeTreasureStatusService } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.service.js";
import { ProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.repository.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import type { ProfessionOverviewCraftLookup } from "./profession-overview-work.contracts.js";
import { resolveCraftingCoverage } from "./profession-overview-work.contracts.js";
import {
  buildProfessionOverviewWorkRow,
  buildProfessionOverviewWorkSummary,
  sortProfessionOverviewWorkRows
} from "./profession-overview-work.mapper.js";
import { resolveEffectiveProfessionOverviewSkills } from "./profession-overview-work-effective-skill.js";
import { ProfessionOverviewWorkRepository } from "./profession-overview-work.repository.js";
import type { ProfessionOverviewWorkResponse } from "./profession-overview-work.types.js";

function createDefaultCraftLookup(): ProfessionOverviewCraftLookup {
  const repository = new ProfessionDetailRepository();
  const recipeRepository = new ProfessionRecipeRepository();
  const service = new ProfessionDetailService(
    repository,
    recipeRepository
  );

  return {
    getOverview: () => service.getOverview()
  };
}

export class ProfessionOverviewWorkService {
  constructor(
    private readonly assignmentRepository =
      new ProfessionOverviewWorkRepository(),
    private readonly weeklyStatusService =
      new ProfessionWeeklyStatusService(
        new ProfessionWeeklyStatusRepository()
      ),
    private readonly treasureStatusService =
      new ProfessionKnowledgeTreasureStatusService(
        new ProfessionKnowledgeTreasureStatusRepository()
      ),
    private readonly craftLookup: ProfessionOverviewCraftLookup =
      createDefaultCraftLookup(),
    private readonly professionAuthorityService =
      new CharacterProfessionAuthorityService(
        new CharacterExternalSnapshotRepository()
      ),
    private readonly profileAuthorityService =
      new CharacterProfileAuthorityService(
        new CharacterExternalSnapshotRepository()
      )
  ) {}

  async getOverview(): Promise<ProfessionOverviewWorkResponse> {
    const [
      rawAssignments,
      weeklyOverview,
      treasureOverview,
      craftOverview
    ] = await Promise.all([
      this.assignmentRepository.findAssignments(),
      this.weeklyStatusService.getOverview(),
      this.treasureStatusService.getOverview(),
      this.craftLookup.getOverview()
    ]);

    const distinctCharacters = new Map(
      rawAssignments.map((assignment) => [
        assignment.characterId,
        {
          id: assignment.characterId,
          name: assignment.characterName,
          realm: assignment.realm,
          region: assignment.region,
          level: assignment.level,
          className: assignment.className
        }
      ])
    );

    const [effectiveSkillByCharacterProfession, identityByCharacterId] =
      await Promise.all([
        resolveEffectiveProfessionOverviewSkills(
          rawAssignments,
          this.professionAuthorityService
        ),
        resolveEffectiveCharacterIdentities(
          [...distinctCharacters.values()],
          this.profileAuthorityService
        )
      ]);

    // Public base skill/className only - knowledgePoints (addon-private)
    // passes through unchanged.
    const assignments = rawAssignments.map((assignment) => {
      const identity = identityByCharacterId.get(assignment.characterId);

      return {
        ...assignment,
        className: identity?.className ?? assignment.className,
        skill:
          effectiveSkillByCharacterProfession.get(
            `${assignment.characterId}:${assignment.professionKey}`
          ) ?? assignment.skill
      };
    });

    const weeklyByCharacterProfession = new Map<
      string,
      (typeof weeklyOverview.characters)[number]["professions"][number]
    >();

    for (const character of weeklyOverview.characters) {
      for (const profession of character.professions) {
        weeklyByCharacterProfession.set(
          `${character.id}:${profession.professionKey}`,
          profession
        );
      }
    }

    const treasureByCharacterProfession = new Map<
      string,
      (typeof treasureOverview.characters)[number]["professions"][number]
    >();

    for (const character of treasureOverview.characters) {
      for (const profession of character.professions) {
        treasureByCharacterProfession.set(
          `${character.id}:${profession.professionKey}`,
          profession
        );
      }
    }

    const rows = sortProfessionOverviewWorkRows(
      assignments.map((assignment) =>
        buildProfessionOverviewWorkRow({
          assignment,
          weeklyProfession:
            weeklyByCharacterProfession.get(
              `${assignment.characterId}:${assignment.professionKey}`
            ) ?? null,
          treasureProfession:
            treasureByCharacterProfession.get(
              `${assignment.characterId}:${assignment.professionKey}`
            ) ?? null
        })
      )
    );

    return {
      summary: buildProfessionOverviewWorkSummary({
        rows,
        craftingCoverage: resolveCraftingCoverage(
          craftOverview.items
        )
      }),
      rows
    };
  }
}
