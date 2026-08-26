import { ProfessionDetailRepository } from "../../../professions/api/details/profession-detail.repository.js";
import { ProfessionDetailService } from "../../../professions/api/details/profession-detail.service.js";
import { ProfessionRecipeRepository } from "../../../professions/api/details/profession-recipe.repository.js";

export type ProfessionIssuesByCharacter =
  Map<
    string,
    {
      hasTrackedProfession: boolean;
      partialIssues: string[];
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
      partialIssues: [] as string[]
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
        }
      }
    )
  );

  return result;
}
