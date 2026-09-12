import type { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";

export type ProfessionOverviewSkillAssignment = {
  characterId: string;
  professionKey: string;
  professionName: string;
  skill: number;
};

/*
 * Phase F3: the Profession Work Matrix's "skill" column is the raw BASE
 * profession skill (see resolveSkillDisplay in profession-overview-work
 * .mapper.ts - it never adds skillModifier or any crafting-derived value),
 * so it can be replaced outright by the same BLIZZARD-primary/ADDON-
 * fallback public skill Overview, recipe eligibility, and specialization
 * display already use - without touching knowledgePoints, weekly/
 * Treatise/Drops/Treasures state, or crafting simulation, none of which
 * this function ever reads or returns.
 *
 * One authority lookup per distinct character (passing that character's
 * full addon profession list at once, matching
 * CharacterProfessionAuthorityService's own per-character contract),
 * not one per assignment row.
 */
export async function resolveEffectiveProfessionOverviewSkills(
  assignments: ProfessionOverviewSkillAssignment[],
  professionAuthorityService: CharacterProfessionAuthorityService
): Promise<Map<string, number>> {
  const assignmentsByCharacterId = new Map<
    string,
    ProfessionOverviewSkillAssignment[]
  >();

  for (const assignment of assignments) {
    const existing =
      assignmentsByCharacterId.get(assignment.characterId) ?? [];
    existing.push(assignment);
    assignmentsByCharacterId.set(assignment.characterId, existing);
  }

  const entries = await Promise.all(
    Array.from(assignmentsByCharacterId.entries()).map(
      async ([characterId, characterAssignments]) => {
        const results =
          await professionAuthorityService.getAuthoritativeProfessions(
            characterId,
            characterAssignments.map((assignment) => ({
              professionKey: assignment.professionKey,
              professionName: assignment.professionName,
              skill: assignment.skill
            }))
          );

        return characterAssignments.map((assignment) => {
          const match = results.find(
            (entry) => entry.professionKey === assignment.professionKey
          );

          return [
            `${characterId}:${assignment.professionKey}`,
            match?.skill ?? assignment.skill
          ] as const;
        });
      }
    )
  );

  return new Map(entries.flat());
}
