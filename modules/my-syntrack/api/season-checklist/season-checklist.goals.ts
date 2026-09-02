import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import { deriveTwoKRioSignal } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type {
  SeasonGoalSignal,
  SeasonChecklistCharacter
} from "./season-checklist.types.js";

const DEFAULT_MILESTONE = 2000;
const MILESTONE_LABEL = "2K";

type ResolvedTracker = {
  definition: TrackerDefinitionRow;
  state: CharacterTrackerState | null;
};

/*
 * Condensed M+ Season cell:
 *   ✓ 2K
 *   1847 → 2K
 *   ?
 * Stretch targets (2.5K/3K/…) stay out of V1 until purposes exist.
 */
export function deriveSeasonMythicPlusGoal(
  resolved: ResolvedTracker | null,
  milestone = DEFAULT_MILESTONE
): SeasonGoalSignal {
  const signal = deriveTwoKRioSignal(resolved);
  const title = `Current-season Mythic+ rating / ${milestone} milestone`;

  if (signal.state === "UNKNOWN" || signal.state === "NOT_APPLICABLE") {
    return {
      key: "rating-2000",
      title: "Mythic+ rating",
      state: signal.state,
      label: signal.label,
      detail: title,
      actionLabel: null
    };
  }

  if (signal.state === "COMPLETE") {
    return {
      key: "rating-2000",
      title: "Mythic+ rating",
      state: "COMPLETE",
      label: `✓ ${MILESTONE_LABEL}`,
      detail: title,
      actionLabel: null
    };
  }

  return {
    key: "rating-2000",
    title: "Mythic+ rating",
    state: "INCOMPLETE",
    label: `${signal.label} → ${MILESTONE_LABEL}`,
    detail: title,
    actionLabel: `Reach ${MILESTONE_LABEL} Mythic+ rating`
  };
}

/** @deprecated use deriveSeasonMythicPlusGoal */
export function deriveSeasonTwoKGoal(
  resolved: ResolvedTracker | null
): SeasonGoalSignal {
  return deriveSeasonMythicPlusGoal(resolved);
}

export function summarizeSeasonGoals(
  goals: SeasonGoalSignal[]
): Pick<
  SeasonChecklistCharacter,
  "goalsOpen" | "goalsComplete" | "goalsUnknown" | "action"
> {
  let goalsOpen = 0;
  let goalsComplete = 0;
  let goalsUnknown = 0;
  let action: string | null = null;

  for (const goal of goals) {
    if (goal.state === "COMPLETE") {
      goalsComplete += 1;
      continue;
    }

    if (goal.state === "UNKNOWN") {
      goalsUnknown += 1;
      continue;
    }

    if (goal.state === "INCOMPLETE") {
      goalsOpen += 1;
      action ??= goal.actionLabel;
    }
  }

  return {
    goalsOpen,
    goalsComplete,
    goalsUnknown,
    action
  };
}
