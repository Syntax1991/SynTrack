import type { MythicPlusSeasonProgress } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

const RESILIENT_START = 12;
const RESILIENT_DUNGEON_COUNT = 8;

/**
 * RESI: highest current-season Resilient Keystone floor unlocked by timing
 * ALL 8 current-season dungeons at that level or higher.
 *
 * `target === null` (the V1 default, and still the default via Manage
 * Goals): informational only — state is set for token tone alone, and the
 * caller must never fold this signal into summarizeSeasonGoals, since there
 * is no universal completion target.
 *
 * `target` set (user opted in via Manage Goals): a real goal — COMPLETE
 * once the floor reaches the target, INCOMPLETE below it, with a
 * target-aware action. The caller decides whether to include this signal in
 * summarizeSeasonGoals based on whether a target is configured.
 *
 * A dungeon with no captured run this season contributes an effective 0
 * (truthfully "not timed", which trivially fails the >=12 test) — that is
 * NOT the same as fabricating a value for missing capture, which still
 * returns UNKNOWN via `progress.captured`.
 */
export function deriveResilientKeystoneGoal(
  progress: MythicPlusSeasonProgress | null,
  target: number | null = null
): SeasonGoalSignal {
  const title = "Resilient Keystone";
  const detail = `Highest Keystone floor unlocked by timing all ${RESILIENT_DUNGEON_COUNT} current-season dungeons at that level or higher`;
  const unknown: SeasonGoalSignal = {
    key: "resilient-keystone",
    title,
    state: "UNKNOWN",
    label: "?",
    detail,
    actionLabel: null
  };

  if (!progress || !progress.captured) {
    return unknown;
  }

  if (progress.dungeonBests.length > RESILIENT_DUNGEON_COUNT) {
    // More distinct dungeons than the season defines — don't trust the shape.
    return unknown;
  }

  const missing = RESILIENT_DUNGEON_COUNT - progress.dungeonBests.length;
  const levels = [
    ...progress.dungeonBests.map((dungeon) => dungeon.bestKeyLevel),
    ...Array(missing).fill(0)
  ];
  const minLevel = Math.min(...levels);
  const atOrAboveFloor = levels.filter(
    (level) => level >= RESILIENT_START
  ).length;
  const label =
    minLevel >= RESILIENT_START
      ? String(minLevel)
      : `${atOrAboveFloor}/${RESILIENT_DUNGEON_COUNT} → ${RESILIENT_START}`;

  if (target === null) {
    return {
      key: "resilient-keystone",
      title,
      state: minLevel >= RESILIENT_START ? "COMPLETE" : "INCOMPLETE",
      label,
      detail,
      actionLabel: null
    };
  }

  return {
    key: "resilient-keystone",
    title,
    state: minLevel >= target ? "COMPLETE" : "INCOMPLETE",
    label,
    detail,
    actionLabel: minLevel >= target ? null : `Reach Resilient Keystone ${target}`
  };
}
