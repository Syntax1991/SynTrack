import { TIER_TARGET_PIECES } from "../gear-readiness/gear-tier-embellishment.deriver.js";
import type { TierOverviewState } from "../overview/overview.types.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

/**
 * Season TIER goal — derived from canonical Gear TierOverviewState.
 * Never persists completion; never invents 0/4 from missing evidence.
 */
export function deriveSeasonTierGoal(
  tier: TierOverviewState
): SeasonGoalSignal {
  const title = "Current-season 4pc Tier Set";
  const detail = "Current Midnight Season 2 Tier set pieces toward 4pc";

  if (tier.state === "NOT_TRACKED") {
    return {
      key: "tier-4pc",
      title,
      state: "NOT_APPLICABLE",
      label: "—",
      detail,
      actionLabel: null
    };
  }

  if (tier.state === "UNKNOWN") {
    return {
      key: "tier-4pc",
      title,
      state: "UNKNOWN",
      label: "?",
      detail,
      actionLabel: null
    };
  }

  const current = Math.min(
    Math.max(tier.equippedPieces, 0),
    TIER_TARGET_PIECES
  );

  if (current >= TIER_TARGET_PIECES || tier.fourPiece) {
    return {
      key: "tier-4pc",
      title,
      state: "COMPLETE",
      label: `✓ ${TIER_TARGET_PIECES}/${TIER_TARGET_PIECES}`,
      detail,
      actionLabel: null
    };
  }

  return {
    key: "tier-4pc",
    title,
    state: "INCOMPLETE",
    label: `${current}/${TIER_TARGET_PIECES}`,
    detail,
    actionLabel: "Complete 4pc tier set"
  };
}
