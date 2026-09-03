import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type {
  SeasonGoalSignal,
  SeasonChecklistCharacter
} from "./season-checklist.types.js";

const DEFAULT_MILESTONE = 2000;

type ResolvedTracker = {
  definition: TrackerDefinitionRow;
  state: CharacterTrackerState | null;
};

/** Raw recorded rating — the actual score always stays visible, never
 * collapsed to a generic "✓ 2K"-style placeholder. */
function ratingValue(resolved: ResolvedTracker | null): number | null {
  const value = resolved?.state?.value;

  if (
    !resolved ||
    !resolved.state ||
    resolved.state.state === "UNKNOWN" ||
    !value ||
    value.valueType !== "NUMBER"
  ) {
    return null;
  }

  return value.number;
}

/** Compact target label: 2000 -> "2K", 2500 -> "2.5K", 2750 -> "2.75K". */
function formatCompactTarget(target: number): string {
  if (target < 1000) {
    return String(target);
  }

  const inThousands = Math.round((target / 1000) * 100) / 100;
  const formatted =
    inThousands % 1 === 0
      ? String(inThousands)
      : inThousands.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

  return `${formatted}K`;
}

/*
 * Condensed Season SCORE cell, target-aware (configurable via Manage Goals):
 *   2678 ✓        (target reached)
 *   1847 → 2K     (target 2000)
 *   1847 → 2.5K   (target 2500)
 *   ?
 */
export function deriveSeasonMythicPlusGoal(
  resolved: ResolvedTracker | null,
  milestone = DEFAULT_MILESTONE
): SeasonGoalSignal {
  const title = `Current-season Mythic+ rating / ${formatCompactTarget(milestone)} milestone`;
  const score = ratingValue(resolved);

  if (score === null) {
    return {
      key: "rating-2000",
      title: "Mythic+ rating",
      state: "UNKNOWN",
      label: "?",
      detail: title,
      actionLabel: null
    };
  }

  const milestoneLabel = formatCompactTarget(milestone);

  if (score >= milestone) {
    return {
      key: "rating-2000",
      title: "Mythic+ rating",
      state: "COMPLETE",
      label: `${score} ✓`,
      detail: title,
      actionLabel: null
    };
  }

  return {
    key: "rating-2000",
    title: "Mythic+ rating",
    state: "INCOMPLETE",
    label: `${score} → ${milestoneLabel}`,
    detail: title,
    actionLabel: `Reach ${milestoneLabel} Mythic+ rating`
  };
}

/** Overrides any goal signal to NOT_APPLICABLE ("—") when the user has
 * disabled it via Manage Goals — summarizeSeasonGoals already skips
 * NOT_APPLICABLE, so a disabled goal never contributes to Status/Action. */
export function applyGoalEnabledGate(
  signal: SeasonGoalSignal,
  enabled: boolean
): SeasonGoalSignal {
  if (enabled) {
    return signal;
  }

  return {
    ...signal,
    state: "NOT_APPLICABLE",
    label: "—",
    actionLabel: null
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
    if (goal.state === "NOT_APPLICABLE") {
      continue;
    }

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

/** Compact STATUS cell — never "5?". */
export function seasonStatusLabel(character: {
  goalsOpen: number;
  goalsComplete: number;
  goalsUnknown: number;
}): string {
  if (character.goalsOpen > 0) {
    return `${character.goalsOpen} open`;
  }

  if (character.goalsUnknown > 0) {
    return `${character.goalsUnknown} unknown`;
  }

  if (character.goalsComplete > 0) {
    return "✓";
  }

  return "—";
}

export function seasonStatusDetail(character: {
  goalsOpen: number;
  goalsUnknown: number;
}): string | null {
  if (character.goalsOpen > 0 && character.goalsUnknown > 0) {
    return `${character.goalsOpen} open · ${character.goalsUnknown} unresolved`;
  }

  return null;
}

/**
 * ACTION cell: never show ✓ while any enabled goal is UNKNOWN.
 */
export function seasonActionDisplay(character: {
  action: string | null;
  goalsOpen: number;
  goalsComplete: number;
  goalsUnknown: number;
}): { kind: "action" | "unknown" | "complete" | "empty"; label: string } {
  if (character.goalsOpen > 0 && character.action) {
    return { kind: "action", label: character.action };
  }

  if (character.goalsOpen > 0) {
    return { kind: "action", label: "Continue season goals" };
  }

  if (character.goalsUnknown > 0) {
    return { kind: "unknown", label: "?" };
  }

  if (character.goalsComplete > 0) {
    return { kind: "complete", label: "✓" };
  }

  return { kind: "empty", label: "—" };
}
