import type { CharacterProfessionAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profession-authority.service.js";

export type SpecializationProfessionAssignment = {
  skill: number;
  profession: { key: string; name: string };
};

/*
 * PUBLIC skill display only (Phase F1 corrective review, Section 4): the
 * same Blizzard-primary/addon-fallback value Overview and recipe
 * eligibility already show - specialization node ranks/knowledge points
 * remain addon-only, untouched by this lookup.
 */
export async function resolveEffectiveSkillByProfessionKey(
  characterId: string,
  assignments: SpecializationProfessionAssignment[],
  professionAuthorityService: CharacterProfessionAuthorityService
): Promise<Map<string, number>> {
  const results = await professionAuthorityService.getAuthoritativeProfessions(
    characterId,
    assignments.map((assignment) => ({
      professionKey: assignment.profession.key,
      professionName: assignment.profession.name,
      skill: assignment.skill
    }))
  );

  return new Map(
    results
      .filter(
        (entry): entry is typeof entry & { professionKey: string } =>
          entry.professionKey !== null
      )
      .map((entry) => [entry.professionKey, entry.skill])
  );
}
