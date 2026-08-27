import type {
  AttentionItem,
  CharacterProfessionSummary,
  ProfessionOverviewState
} from "./overview.types.js";

export type OverviewProfessionCharacterInput =
  {
    id: string;
    name: string;
    hasTrackedProfession: boolean;
    partialProfessionIssues: string[];
    professions: CharacterProfessionSummary[];
  };

/*
 * Professions is owned by the Professions module - this only reads its
 * already-verified per-(character, profession) dataStatus
 * ("TRACKED"|"PARTIAL"|"UNTRACKED"|"NO_CATALOG", see
 * profession-coverage.mapper.ts's resolveDataStatus). It never inspects
 * individual specialization node ranks itself, so it cannot reintroduce
 * the "0/x is wrong" class of bug - PARTIAL is the one dataStatus value
 * that already means something concrete went wrong (specialization
 * progress was captured, but no recipes/capabilities were - an import
 * gap), so it is the only signal used as an attention trigger here.
 */
export function resolveProfessionOverviewState(
  character: OverviewProfessionCharacterInput
): {
  professions: ProfessionOverviewState;
  attentionItem: AttentionItem | null;
} {
  const issueCount =
    character
      .partialProfessionIssues
      .length;

  const partialProfessionId =
    character.professions.find(
      (profession) =>
        profession.dataStatus ===
        "PARTIAL"
    )?.professionId ?? null;

  const professions: ProfessionOverviewState =
    {
      state:
        issueCount > 0
          ? "ATTENTION"
          : character.hasTrackedProfession
            ? "READY"
            : "NOT_TRACKED",
      issueCount,
      issues:
        character.partialProfessionIssues,
      items: character.professions
    };

  if (professions.state !== "ATTENTION") {
    return {
      professions,
      attentionItem: null
    };
  }

  return {
    professions,
    attentionItem: {
      id: `${character.id}:profession`,
      characterId: character.id,
      characterName: character.name,
      domain: "profession",
      severity: "this-week",
      label:
        "Profession data incomplete",
      detail:
        character
          .partialProfessionIssues[0] ??
        null,
      /*
       * ProfessionSpecializationsPage already supports a ?character=
       * deep link (useSearchParams -> requestedCharacterId) - reuse it
       * rather than inventing a new selection mechanism.
       */
      path:
        `/professions/specializations?character=${encodeURIComponent(character.id)}` +
        (partialProfessionId
          ? `&profession=${encodeURIComponent(partialProfessionId)}`
          : "")
    }
  };
}
