import type { CharacterProfessionAuthorityService } from "../../../my-syntrack/api/character-external-sync/character-profession-authority.service.js";

export type EffectiveSkillCrafterInput = {
  characterId: string;
  skill: number;
};

/*
 * Phase F1 corrective review, Section 4: recipe eligibility must read the
 * SAME Blizzard-primary/addon-fallback PUBLIC skill Overview already
 * shows, rather than maintaining a second, competing raw-addon truth.
 * This resolves one effective public skill per distinct character (a
 * recipe catalog lists many characters for the SAME profession, so each
 * character's authority lookup only needs to happen once, not once per
 * recipe row) - skillModifier/knowledgePoints/specialization progress are
 * never touched here; the caller (profession-recipe.mapper.ts) still adds
 * the addon-private skillModifier on top of this public skill itself.
 */
export async function resolveEffectivePublicSkillByCharacterId(
  crafters: EffectiveSkillCrafterInput[],
  professionKey: string,
  professionName: string,
  professionAuthorityService: CharacterProfessionAuthorityService
): Promise<Map<string, number>> {
  const addonSkillByCharacterId = new Map<string, number>();

  for (const crafter of crafters) {
    if (!addonSkillByCharacterId.has(crafter.characterId)) {
      addonSkillByCharacterId.set(crafter.characterId, crafter.skill);
    }
  }

  const entries = await Promise.all(
    Array.from(addonSkillByCharacterId.entries()).map(
      async ([characterId, addonSkill]) => {
        const results = await professionAuthorityService.getAuthoritativeProfessions(
          characterId,
          [{ professionKey, professionName, skill: addonSkill }]
        );

        const match = results.find(
          (entry) => entry.professionKey === professionKey
        );

        return [characterId, match?.skill ?? addonSkill] as const;
      }
    )
  );

  return new Map(entries);
}
