import type { WeeklyChecklistResponse } from "../types/weeklyChecklist.types";

function formatResetLabel(
  endsAt: string
): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(new Date(endsAt));
}

/*
 * Replaces the four large KPI cards with one compact line - reset
 * context stays visible without reserving a dedicated row for it.
 */
export function formatWeeklySummaryText(
  checklist: WeeklyChecklistResponse
): string {
  return `${checklist.characters.length} characters · ${checklist.summary.completedCharacterCount} complete · ${checklist.summary.completedTaskCount}/${checklist.summary.totalTaskCount} tasks · Reset ${formatResetLabel(checklist.period.endsAt)}`;
}
