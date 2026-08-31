import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

export function highestCompletedKeyLevel(
  snapshot: WeeklyGameplaySnapshotInput
): number | null {
  if (!snapshot.mythicPlusCaptured) {
    return null;
  }

  const levels = snapshot.mythicPlusRuns
    .filter((run) => run.completed !== false && run.thisWeek !== false)
    .map((run) => run.keyLevel);

  if (levels.length === 0) {
    return null;
  }

  return Math.max(...levels);
}
