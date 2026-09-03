import type { MythicPlusSeasonProgress } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

const RESILIENT_START = 12;
const RESILIENT_DUNGEON_COUNT = 8;

/**
 * RESI: highest current-season Resilient Keystone floor unlocked by timing
 * ALL 8 current-season dungeons at that level or higher. Informational only
 * in V1 — the caller must never fold this signal into summarizeSeasonGoals,
 * since a Character can keep raising the floor indefinitely and there is no
 * universal completion target.
 *
 * A dungeon with no captured run this season contributes an effective 0
 * (truthfully "not timed", which trivially fails the >=12 test) — that is
 * NOT the same as fabricating a value for missing capture, which still
 * returns UNKNOWN via `progress.captured`.
 */
export function deriveResilientKeystoneGoal(
  progress: MythicPlusSeasonProgress | null
): SeasonGoalSignal {
  const title = "Resilient Keystone";
  const detail = `Highest Keystone floor unlocked by timing all ${RESILIENT_DUNGEON_COUNT} current-season dungeons at that level or higher`;

  if (!progress || !progress.captured) {
    return {
      key: "resilient-keystone",
      title,
      state: "UNKNOWN",
      label: "?",
      detail,
      actionLabel: null
    };
  }

  if (progress.dungeonBests.length > RESILIENT_DUNGEON_COUNT) {
    // More distinct dungeons than the season defines — don't trust the shape.
    return {
      key: "resilient-keystone",
      title,
      state: "UNKNOWN",
      label: "?",
      detail,
      actionLabel: null
    };
  }

  const missing = RESILIENT_DUNGEON_COUNT - progress.dungeonBests.length;
  const levels = [
    ...progress.dungeonBests.map((dungeon) => dungeon.bestKeyLevel),
    ...Array(missing).fill(0)
  ];
  const minLevel = Math.min(...levels);

  if (minLevel >= RESILIENT_START) {
    return {
      key: "resilient-keystone",
      title,
      state: "COMPLETE",
      label: String(minLevel),
      detail,
      actionLabel: null
    };
  }

  const atOrAboveFloor = levels.filter(
    (level) => level >= RESILIENT_START
  ).length;

  return {
    key: "resilient-keystone",
    title,
    state: "INCOMPLETE",
    label: `${atOrAboveFloor}/${RESILIENT_DUNGEON_COUNT} → ${RESILIENT_START}`,
    detail,
    actionLabel: null
  };
}
