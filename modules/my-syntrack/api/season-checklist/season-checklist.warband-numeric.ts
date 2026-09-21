import type { SeasonGoalPreferenceValue } from "../season-goal-preference/season-goal-preference.types.js";
import type { MythicPlusSeasonProgress } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import { deriveSeasonMythicPlusGoalFromScore } from "./season-checklist.goals.js";
import {
  deriveResilientKeystoneGoal,
  resilientKeystoneFloor
} from "./season-checklist.resilient.js";
import type { SeasonWarbandGoalView } from "./season-checklist.types.js";

const SCORE_DETAIL =
  "Best current-season Mythic+ rating across gameplay Characters toward the shared Warband target";
const RESI_DETAIL =
  "Best known Resilient Keystone floor across gameplay Characters toward the shared Warband target";

/**
 * Warband Score / Resi are preference-scoped account goals. Progress is
 * never a fabricated Warband rating — it is the best known per-Character
 * fact. COMPLETE if any gameplay Character meets the shared target.
 * UNKNOWN if nobody is known-complete and at least one Character is
 * unresolved. INCOMPLETE only when every gameplay Character is known
 * and none meet the target.
 */
export function buildWarbandNumericGoals(
  ratings: Array<number | null>,
  resilientProgress: Array<MythicPlusSeasonProgress | null>,
  warbandGoalPreferences: Map<string, SeasonGoalPreferenceValue>
): SeasonWarbandGoalView[] {
  const goals: SeasonWarbandGoalView[] = [];
  const scorePreference = warbandGoalPreferences.get("warband-mythic-plus-score");
  const resiPreference = warbandGoalPreferences.get("warband-resilient-keystone");

  if ((scorePreference?.enabled ?? true) !== false) {
    goals.push(
      deriveWarbandMythicPlusGoal(
        ratings,
        scorePreference?.numericTarget ?? 2000
      )
    );
  }

  if (resiPreference?.enabled === true && resiPreference.numericTarget !== null) {
    goals.push(
      deriveWarbandResilientKeystoneGoal(
        resilientProgress,
        resiPreference.numericTarget
      )
    );
  }

  return goals;
}

export function deriveWarbandMythicPlusGoal(
  ratings: Array<number | null>,
  target: number
): SeasonWarbandGoalView {
  const known = ratings.filter((rating): rating is number => rating !== null);
  const hasUnknown = ratings.length === 0 || known.length < ratings.length;
  const best = known.length > 0 ? Math.max(...known) : null;
  const derived = deriveSeasonMythicPlusGoalFromScore(best, target);

  if (derived.state === "COMPLETE") {
    return toWarbandScore(derived);
  }

  if (hasUnknown) {
    return toWarbandScore({
      ...derived,
      state: "UNKNOWN",
      actionLabel: null
    });
  }

  return toWarbandScore(derived);
}

export function deriveWarbandResilientKeystoneGoal(
  resilientProgress: Array<MythicPlusSeasonProgress | null>,
  target: number
): SeasonWarbandGoalView {
  const floors = resilientProgress.map((progress) =>
    resilientKeystoneFloor(progress)
  );
  const known = floors.filter((floor): floor is number => floor !== null);
  const hasUnknown =
    resilientProgress.length === 0 || known.length < floors.length;
  const bestIndex = indexOfBestFloor(floors);
  const bestProgress =
    bestIndex === null ? null : resilientProgress[bestIndex] ?? null;
  const derived = deriveResilientKeystoneGoal(bestProgress, target);

  if (derived.state === "COMPLETE") {
    return toWarbandResi(derived);
  }

  if (hasUnknown) {
    return toWarbandResi({
      ...derived,
      state: "UNKNOWN",
      actionLabel: null
    });
  }

  return toWarbandResi(derived);
}

function indexOfBestFloor(floors: Array<number | null>): number | null {
  let bestIndex: number | null = null;
  let bestFloor = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < floors.length; index += 1) {
    const floor = floors[index];
    if (floor === null || floor === undefined) {
      continue;
    }
    if (floor > bestFloor) {
      bestFloor = floor;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function toWarbandScore(
  signal: ReturnType<typeof deriveSeasonMythicPlusGoalFromScore>
): SeasonWarbandGoalView {
  return {
    key: "warband-mythic-plus-score",
    title: "Mythic+ Score",
    state: signal.state,
    label: signal.label,
    detail: SCORE_DETAIL,
    actionLabel: signal.actionLabel
  };
}

function toWarbandResi(
  signal: ReturnType<typeof deriveResilientKeystoneGoal>
): SeasonWarbandGoalView {
  return {
    key: "warband-resilient-keystone",
    title: "Resilient Keystone",
    state: signal.state,
    label: signal.label,
    detail: RESI_DETAIL,
    actionLabel: signal.actionLabel
  };
}
