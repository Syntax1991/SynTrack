import type { CharacterProfessionKnowledgeTreasureStatus } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import type {
  AttentionItem,
  ProfessionKnowledgeTreasureOverviewState
} from "./overview.types.js";

export type OverviewProfessionKnowledgeTreasureCharacterInput =
  CharacterProfessionKnowledgeTreasureStatus;

/*
 * Permanent Knowledge Treasures are read-only, action-only in
 * Overview: never a mandatory column (see the profession weekly
 * correctness follow-up's Knowledge Treasures addition), only an
 * attentionItem when at least one applicable treasure is proven
 * INCOMPLETE. A character with zero applicable treasures (no tracked
 * profession) is NOT_TRACKED, never a false READY/ATTENTION. Unlike
 * Weekly Quest/Treatise/Drops, an UNKNOWN treasure never surfaces
 * attention on its own - only a proven-missing one does, since the
 * whole point is "what did you definitely miss", not "what haven't we
 * checked yet".
 */
export function resolveProfessionKnowledgeTreasureOverviewState(
  character: OverviewProfessionKnowledgeTreasureCharacterInput
): {
  professionKnowledgeTreasures: ProfessionKnowledgeTreasureOverviewState;
  attentionItem: AttentionItem | null;
} {
  const { treasures } = character;

  const state =
    treasures.applicableTotal === 0
      ? "NOT_TRACKED"
      : treasures.incompleteCount > 0
        ? "ATTENTION"
        : treasures.unknownCount > 0
          ? "UNKNOWN"
          : "READY";

  const professionKnowledgeTreasures: ProfessionKnowledgeTreasureOverviewState =
    {
      state,
      treasures,
      professions: character.professions
    };

  if (state !== "ATTENTION") {
    return {
      professionKnowledgeTreasures,
      attentionItem: null
    };
  }

  const missingByProfession = character.professions
    .map((profession) => {
      const missing = profession.sources.filter(
        (source) => source.state === "INCOMPLETE"
      ).length;

      return { name: profession.name, missing };
    })
    .filter((entry) => entry.missing > 0);

  const totalMissing = missingByProfession.reduce(
    (sum, entry) => sum + entry.missing,
    0
  );

  const label =
    missingByProfession.length === 1
      ? `${missingByProfession[0]!.name} knowledge treasure${
          missingByProfession[0]!.missing === 1 ? "" : "s"
        } missing`
      : `${totalMissing} profession knowledge treasures missing`;

  const detail =
    missingByProfession.length > 0
      ? missingByProfession
          .map(
            (entry) =>
              `${entry.name} (${entry.missing} missing)`
          )
          .join(", ")
      : null;

  return {
    professionKnowledgeTreasures,
    attentionItem: {
      id: `${character.id}:profession-knowledge-treasure`,
      characterId: character.id,
      characterName: character.name,
      domain: "profession-knowledge-treasure",
      severity: "this-week",
      label,
      detail,
      path: `/characters/${character.id}`
    }
  };
}
