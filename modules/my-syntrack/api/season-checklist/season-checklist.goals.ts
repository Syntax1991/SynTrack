import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import { deriveTwoKRioSignal } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type {
  SeasonGoalSignal,
  SeasonChecklistCharacter
} from "./season-checklist.types.js";

const TWO_K_GOAL_KEY = "rating-2000";
const TWO_K_GOAL_TITLE = "2K Mythic+ rating";

type ResolvedTracker = {
  definition: TrackerDefinitionRow;
  state: CharacterTrackerState | null;
};

export function deriveSeasonTwoKGoal(
  resolved: ResolvedTracker | null
): SeasonGoalSignal {
  const signal = deriveTwoKRioSignal(resolved);

  return {
    key: TWO_K_GOAL_KEY,
    title: TWO_K_GOAL_TITLE,
    state: signal.state,
    label: signal.label,
    detail: signal.title,
    actionLabel:
      signal.state === "INCOMPLETE"
        ? "Reach 2K Mythic+ rating"
        : null
  };
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
