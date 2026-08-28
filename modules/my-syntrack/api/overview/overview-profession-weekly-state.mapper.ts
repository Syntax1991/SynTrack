import type { CharacterProfessionWeeklyStatus } from "../profession-weekly/profession-weekly-status.types.js";
import type {
  AttentionItem,
  ProfessionWeeklyOverviewState
} from "./overview.types.js";

export type OverviewProfessionWeeklyCharacterInput =
  CharacterProfessionWeeklyStatus;

/*
 * Prof KP is owned by ProfessionWeeklyStatusService - this only reads
 * its already-computed aggregate and applies Overview's shared state
 * vocabulary. Knowledge Drops never affects this domain's state: a
 * character with Weekly Quest + Treatise both COMPLETE is READY
 * regardless of Drops (see the hard product rule). A character with
 * zero applicable Prof KP sources (no enabled definitions for either
 * of their professions) is NOT_TRACKED, never a false READY/ATTENTION.
 */
export function resolveProfessionWeeklyOverviewState(
  character: OverviewProfessionWeeklyCharacterInput
): {
  professionWeekly: ProfessionWeeklyOverviewState;
  attentionItem: AttentionItem | null;
} {
  const { profKp, drops } = character;

  const state =
    profKp.applicableTotal === 0
      ? "NOT_TRACKED"
      : profKp.incompleteCount > 0
        ? "ATTENTION"
        : profKp.unknownCount > 0
          ? "UNKNOWN"
          : "READY";

  const professionWeekly: ProfessionWeeklyOverviewState = {
    state,
    profKp,
    drops,
    professions: character.professions
  };

  if (state !== "ATTENTION") {
    return { professionWeekly, attentionItem: null };
  }

  const incompleteLabels = character.professions.flatMap(
    (profession) =>
      profession.sources
        .filter((source) => source.state === "INCOMPLETE")
        .map((source) => `${profession.name} ${source.name}`)
  );

  return {
    professionWeekly,
    attentionItem: {
      id: `${character.id}:profession-weekly`,
      characterId: character.id,
      characterName: character.name,
      domain: "profession-weekly",
      severity: "this-week",
      label: "Profession weekly work remaining",
      detail:
        incompleteLabels.length > 0
          ? `${incompleteLabels.join(", ")} remaining`
          : null,
      path: `/characters/${character.id}`
    }
  };
}
