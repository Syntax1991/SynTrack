import type { WeeklyChecklistTask } from "../types/weeklyChecklist.types";

/*
 * Purely a display shortener for the matrix header - the five-task
 * catalog itself remains server-owned (weekly-checklist.service.ts);
 * an unrecognized future task key safely falls back to its full title.
 */
const compactTaskLabels: Record<
  string,
  string
> = {
  "great-vault": "Vault",
  "mythic-plus": "M+",
  "raid-readiness": "Raid",
  "profession-knowledge": "Prof. KP",
  "gear-readiness": "Gear"
};

export function getCompactTaskLabel(
  task: WeeklyChecklistTask
): string {
  return (
    compactTaskLabels[task.key] ??
    task.title
  );
}
