import type { OverviewSummary } from "../types/overview.types";
import { formatResetCountdown } from "./resetContext";

/*
 * Replaces the four large KPI cards with one compact line - the same
 * facts, none of them consuming a dedicated row of the viewport.
 */
export function formatOverviewSummaryText(
  summary: OverviewSummary,
  now = new Date()
): string {
  return `${summary.characterCount} characters · ${summary.attentionCount} attention · ${summary.readyCount} ready · ${formatResetCountdown(summary.period.endsAt, now)}`;
}
