import type {
  AttentionItem,
  WeeklyOverviewState
} from "./overview.types.js";

export type OverviewWeeklyCharacterInput = {
  id: string;
  name: string;
  completedTaskKeys: string[];
};

/*
 * Weekly Checklist owns this state - it is a real, always-present count
 * (the task catalog is seeded for every character), so 0/5 is an honest
 * fact ("nothing checked off yet this period"), never an UNKNOWN. This
 * mirrors WeeklyChecklistService.getChecklist()'s own completion math
 * exactly (completedTaskKeys.length vs taskCount) - it does not
 * recompute completion, only reads it.
 */
export function resolveWeeklyOverviewState(
  character: OverviewWeeklyCharacterInput,
  taskCount: number
): {
  weekly: WeeklyOverviewState;
  attentionItem: AttentionItem | null;
} {
  const completed =
    character.completedTaskKeys.length;

  const weekly: WeeklyOverviewState = {
    state:
      taskCount === 0
        ? "NOT_TRACKED"
        : completed >= taskCount
          ? "READY"
          : "IN_PROGRESS",
    completed,
    total: taskCount,
    source: "MANUAL_CHECKLIST"
  };

  if (weekly.state !== "IN_PROGRESS") {
    return {
      weekly,
      attentionItem: null
    };
  }

  const remaining =
    taskCount - completed;

  return {
    weekly,
    attentionItem: {
      id: `${character.id}:weekly`,
      characterId: character.id,
      characterName: character.name,
      domain: "weekly",
      severity: "this-week",
      label: "Weekly tasks remaining",
      detail:
        `${remaining} of ${taskCount} weekly ${remaining === 1 ? "task" : "tasks"} left`,
      path: "/weekly-checklist"
    }
  };
}
