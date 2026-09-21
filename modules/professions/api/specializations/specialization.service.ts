import { CharacterExternalSnapshotRepository } from "../../../my-syntrack/api/character-external-sync/character-external-snapshot.repository.js";
import { CharacterProfessionAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profession-authority.service.js";
import { CharacterProfileAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profile-authority.service.js";
import { resolveEffectiveCharacterIdentities } from "../../../my-syntrack/api/character-external-sync/character-profile-effective-identity.js";
import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import { resolveEffectiveSkillByProfessionKey } from "./specialization-effective-skill.js";
import { createTreeView } from "./specialization-tree-view.mapper.js";
import { SpecializationRepository } from "./specialization.repository.js";
import type { SpecializationProgressInput } from "./specialization.types.js";

export class SpecializationService {
  constructor(
    private readonly repository: SpecializationRepository,
    private readonly professionAuthorityService = new CharacterProfessionAuthorityService(
      new CharacterExternalSnapshotRepository()
    ),
    private readonly profileAuthorityService = new CharacterProfileAuthorityService(
      new CharacterExternalSnapshotRepository()
    )
  ) {}

  async getCharacterOverview(characterId: string) {
    const character = await this.repository.findCharacter(characterId);

    if (!character) {
      throw new AppError(404, "Charakter nicht gefunden.");
    }

    const [effectiveSkillByProfessionKey, identityByCharacterId] =
      await Promise.all([
        resolveEffectiveSkillByProfessionKey(
          characterId,
          character.professions,
          this.professionAuthorityService
        ),
        resolveEffectiveCharacterIdentities(
          [character],
          this.profileAuthorityService
        )
      ]);
    const identity = identityByCharacterId.get(character.id);

    const professionIds =
      character.professions.map(
        (assignment) =>
          assignment.professionId
      );

    const trees =
      await this.repository
        .findTreesByProfessionIds(
          professionIds
        );

    const treesByProfessionId =
      new Map<
        string,
        typeof trees
      >();

    for (const tree of trees) {
      const existingTrees =
        treesByProfessionId.get(
          tree.professionId
        ) ?? [];

      existingTrees.push(tree);

      treesByProfessionId.set(
        tree.professionId,
        existingTrees
      );
    }

    const professions =
      character.professions
        .map((assignment) => {
          const progressByNodeId =
            new Map(
              assignment.nodeProgress.map(
                (progress) => [
                  progress.nodeId,
                  progress
                ]
              )
            );

          const professionTrees =
            treesByProfessionId.get(
              assignment.professionId
            ) ?? [];

          return {
            id: assignment.id,
            skill:
              effectiveSkillByProfessionKey.get(
                assignment.profession.key
              ) ?? assignment.skill,
            knowledgePoints:
              assignment.knowledgePoints,
            specializationSummary:
              assignment.specializationSummary,
            profession: {
              id:
                assignment.profession.id,
              key:
                assignment.profession.key,
              name:
                assignment.profession.name,
              category:
                assignment.profession.category
            },
            trees:
              professionTrees.map(
                (tree) =>
                  createTreeView(
                    tree,
                    progressByNodeId
                  )
              )
          };
        })
        .sort(
          (left, right) =>
            left.profession.name.localeCompare(
              right.profession.name,
              "de"
            )
        );

    return {
      character: {
        id: character.id,
        name: character.name,
        realm: character.realm,
        // Phase F3 follow-up: same BLIZZARD-primary/ADDON-fallback
        // identity every other real consumer now shares - overridden
        // here (not persisted), never touching the Character row itself.
        className:
          identity?.className ?? character.className,
        level: identity?.level ?? character.level
      },
      professions
    };
  }

  async updateProfessionProgress(
    characterId: string,
    characterProfessionId: string,
    progress: SpecializationProgressInput[]
  ) {
    const assignment =
      await this.repository
        .findCharacterProfession(
          characterProfessionId
        );

    if (
      !assignment ||
      assignment.characterId !==
        characterId
    ) {
      throw new AppError(
        404,
        "Berufszuweisung für diesen Charakter nicht gefunden."
      );
    }

    const activeProgress =
      progress.filter(
        (entry) =>
          entry.rank > 0
      );

    const nodes =
      await this.repository.findNodesByIds(
        activeProgress.map(
          (entry) =>
            entry.nodeId
        )
      );

    if (
      nodes.length !==
      activeProgress.length
    ) {
      throw new AppError(
        400,
        "Mindestens ein Spezialisierungsknoten ist ungültig."
      );
    }

    const nodeById =
      new Map(
        nodes.map(
          (node) => [
            node.id,
            node
          ]
        )
      );

    for (
      const entry of
      activeProgress
    ) {
      const node =
        nodeById.get(
          entry.nodeId
        );

      if (
        !node ||
        node.tree.professionId !==
          assignment.professionId
      ) {
        throw new AppError(
          400,
          "Ein Spezialisierungsknoten gehört nicht zum ausgewählten Beruf."
        );
      }

      if (
        node.maxRank !== null &&
        entry.rank > node.maxRank
      ) {
        throw new AppError(
          400,
          `${node.name} erlaubt maximal Rang ${node.maxRank}.`
        );
      }
    }

    await this.repository.replaceProgress(
      characterProfessionId,
      progress,
      "MANUAL"
    );

    return this.getCharacterOverview(
      characterId
    );
  }
}