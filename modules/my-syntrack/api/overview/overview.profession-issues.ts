import { ProfessionDetailRepository } from "../../../professions/api/details/profession-detail.repository.js";
import { ProfessionDetailService } from "../../../professions/api/details/profession-detail.service.js";
import { ProfessionRecipeRepository } from "../../../professions/api/details/profession-recipe.repository.js";
import type { CharacterProfessionSummary } from "./overview.types.js";

export type ProfessionIssuesByCharacter =
  Map<
    string,
    {
      hasTrackedProfession: boolean;
      partialIssues: string[];
      professions: CharacterProfessionSummary[];
    }
  >;

/*
 * Reuses ProfessionDetailService exactly as the Professions module itself
 * does (same class, same public methods) - this is Overview READING the
 * existing per-(character, profession) dataStatus, never recomputing it.
 * Bounded by profession count (a handful), not character count, so this
 * stays a small number of queries regardless of roster size.
 */
export async function loadProfessionIssuesByCharacter(): Promise<ProfessionIssuesByCharacter> {
  const service =
    new ProfessionDetailService(
      new ProfessionDetailRepository(),
      new ProfessionRecipeRepository()
    );

  const { items: professions } =
    await service.getOverview();

  const result: ProfessionIssuesByCharacter =
    new Map();

  function entryFor(
    characterId: string
  ) {
    const existing =
      result.get(characterId);

    if (existing) {
      return existing;
    }

    const created = {
      hasTrackedProfession: false,
      partialIssues: [] as string[],
      professions: [] as CharacterProfessionSummary[]
    };

    result.set(
      characterId,
      created
    );

    return created;
  }

  await Promise.all(
    professions.map(
      async (profession) => {
        const detail =
          await service.getDetail(
            profession.id
          );

        for (const character of detail.characters) {
          const entry = entryFor(
            character.character.id
          );

          if (
            character.dataStatus ===
            "TRACKED"
          ) {
            entry.hasTrackedProfession = true;
          }

          if (
            character.dataStatus ===
            "PARTIAL"
          ) {
            entry.partialIssues.push(
              `${profession.name}: specialization progress captured, but no recipes or capabilities imported yet`
            );
          }

          entry.professions.push({
            professionId:
              profession.id,
            key: profession.key,
            name: profession.name,
            category:
              profession.category,
            skill: character.skill,
            knowledgePoints:
              character.knowledgePoints,
            dataStatus:
              character.dataStatus
          });
        }
      }
    )
  );

  for (const entry of result.values()) {
    entry.professions.sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
          "en"
        )
    );
  }

  return result;
}
