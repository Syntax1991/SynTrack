import { EMBELLISHMENT_TARGET_PIECES } from "../gear-readiness/gear-tier-embellishment.deriver.js";
import type { EmbellishmentOverviewState } from "../overview/overview.types.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

/**
 * Season EMB. goal — derived from canonical Gear EmbellishmentOverviewState.
 * Equipped Unique-Equipped Embellished items (category 512), target 2.
 * Never persists completion; never invents 0/2 from missing evidence.
 */
export function deriveSeasonEmbellishmentGoal(
  emb: EmbellishmentOverviewState
): SeasonGoalSignal {
  const title = "Embellishment setup";
  const detail =
    "Equipped Unique-Equipped Embellishments toward Season setup (2)";

  if (emb.state === "NOT_TRACKED") {
    return {
      key: "embellishments",
      title,
      state: "NOT_APPLICABLE",
      label: "—",
      detail,
      actionLabel: null
    };
  }

  if (emb.state === "UNKNOWN") {
    return {
      key: "embellishments",
      title,
      state: "UNKNOWN",
      label: "?",
      detail,
      actionLabel: null
    };
  }

  const current = Math.min(
    Math.max(emb.equippedPieces, 0),
    EMBELLISHMENT_TARGET_PIECES
  );

  if (current >= EMBELLISHMENT_TARGET_PIECES) {
    return {
      key: "embellishments",
      title,
      state: "COMPLETE",
      label: `✓ ${EMBELLISHMENT_TARGET_PIECES}/${EMBELLISHMENT_TARGET_PIECES}`,
      detail,
      actionLabel: null
    };
  }

  return {
    key: "embellishments",
    title,
    state: "INCOMPLETE",
    label: `${current}/${EMBELLISHMENT_TARGET_PIECES}`,
    detail,
    actionLabel: "Complete Embellishment setup"
  };
}
