import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import type { ProfessionIssuesByCharacter } from "./overview.profession-issues.js";

/*
 * Phase F1 read-path integration: overlays Blizzard-primary public skill
 * onto each character's already-built profession summaries, using the
 * SAME CharacterProfessionAuthorityService the Phase C snapshot/refresh
 * pipeline already provides - never a second provider-merge
 * implementation (see character-profession-authority.service.ts's own
 * PRIMARY=BLIZZARD/FALLBACK=ADDON contract, unchanged).
 *
 * Deliberately narrow: only `skill` is overlaid. `knowledgePoints`
 * (addon-permanent, no Blizzard field exists for it at all) is left
 * completely untouched - the authority service's own result type is
 * structurally incapable of carrying it (see Phase C). `dataStatus`
 * (TRACKED/PARTIAL/UNTRACKED) is also left untouched - it reflects
 * whether SynTrack has imported recipes/capabilities for a profession,
 * a fact with no Blizzard equivalent at all.
 *
 * Recipe eligibility / specialization node calculations (the deeper
 * Professions-workspace internals) are deliberately NOT touched by this
 * function - those need live-precise skill for correctness (the same
 * "precision-critical" reasoning that keeps Equipment's manually-edited
 * gem counts addon/user-owned) and were not migrated this phase; see the
 * Phase F1 report for the explicit scoping decision.
 */
export async function applyAuthoritativeProfessionSkill(
  professionIssuesByCharacter: ProfessionIssuesByCharacter,
  professionAuthorityService: CharacterProfessionAuthorityService
): Promise<void> {
  await Promise.all(
    [...professionIssuesByCharacter.entries()].map(
      async ([characterId, entry]) => {
        const authoritative =
          await professionAuthorityService.getAuthoritativeProfessions(
            characterId,
            entry.professions.map((profession) => ({
              professionKey: profession.key,
              professionName: profession.name,
              skill: profession.skill
            }))
          );

        const authoritativeByKey = new Map(
          authoritative.map((result) => [result.professionKey, result])
        );

        for (const profession of entry.professions) {
          const match = authoritativeByKey.get(profession.key);

          if (match) {
            profession.skill = match.skill;
          }
        }
      }
    )
  );
}
