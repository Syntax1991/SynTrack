import type { CharacterProfessionWeeklyStatus } from "../profession-weekly/profession-weekly-status.types.js";
import type {
  AttentionItem,
  ProfessionWeeklyOverviewState
} from "./overview.types.js";

export type OverviewProfessionWeeklyCharacterInput =
  CharacterProfessionWeeklyStatus;

/*
 * Weekly Quest and Treatise are owned by ProfessionWeeklyStatusService
 * as two separate aggregates - this only reads them and applies
 * Overview's shared state vocabulary across both combined (either one
 * having incomplete/unknown sources drives the domain state), never
 * merging them into a single displayed number. Knowledge Drops never
 * affects this domain's state: a character with Weekly Quest +
 * Treatise both COMPLETE is READY regardless of Drops (see the hard
 * product rule). A character with zero applicable sources across both
 * (no enabled definitions for either of their professions) is
 * NOT_TRACKED, never a false READY/ATTENTION.
 */
export function resolveProfessionWeeklyOverviewState(
  character: OverviewProfessionWeeklyCharacterInput
): {
  professionWeekly: ProfessionWeeklyOverviewState;
  attentionItem: AttentionItem | null;
} {
  const { quest, treatise, drops } = character;

  const applicableTotal =
    quest.applicableTotal + treatise.applicableTotal;

  const incompleteCount =
    quest.incompleteCount + treatise.incompleteCount;

  const unknownCount =
    quest.unknownCount + treatise.unknownCount;

  const state =
    applicableTotal === 0
      ? "NOT_TRACKED"
      : incompleteCount > 0
        ? "ATTENTION"
        : unknownCount > 0
          ? "UNKNOWN"
          : "READY";

  const professionWeekly: ProfessionWeeklyOverviewState = {
    state,
    quest,
    treatise,
    drops,
    professions: character.professions
  };

  if (state !== "ATTENTION") {
    return { professionWeekly, attentionItem: null };
  }

  const incompleteLabels = character.professions.flatMap(
    (profession) => {
      const labels: string[] = [];

      if (profession.quest?.state === "INCOMPLETE") {
        labels.push(
          `${profession.name} ${profession.quest.name}`
        );
      }

      if (profession.treatise?.state === "INCOMPLETE") {
        labels.push(
          `${profession.name} ${profession.treatise.name}`
        );
      }

      return labels;
    }
  );

  const label =
    incompleteLabels.length === 1
      ? `${incompleteLabels[0]} remaining`
      : `${incompleteLabels.length} profession weekly sources remaining`;

  return {
    professionWeekly,
    attentionItem: {
      id: `${character.id}:profession-weekly`,
      characterId: character.id,
      characterName: character.name,
      domain: "profession-weekly",
      severity: "this-week",
      label,
      detail:
        incompleteLabels.length > 0
          ? incompleteLabels.join(", ")
          : null,
      path: `/characters/${character.id}`
    }
  };
}
