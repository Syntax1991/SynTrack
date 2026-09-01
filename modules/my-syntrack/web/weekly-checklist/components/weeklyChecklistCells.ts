import { isWeeklyGameplayEnabled } from "../../../api/character-tracking/domain-applicability.js";
import { weekliesProfessionSummaryTitle } from "../../../api/weekly-checklist/weeklies-profession-summary.mapper.js";
import { weekliesSignalTone } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type { WeekliesGameplaySignal } from "../../../api/weekly-checklist/weeklies-gameplay-signals.types.js";
import type { WeeklyChecklistCharacter } from "../types/weeklyChecklist.types";
import { gameplayDomainToken } from "./weeklyChecklistTokens";

export function professionSummaryToken(
  character: WeeklyChecklistCharacter
) {
  const summary = character.professionWeeklySummary;
  const title = weekliesProfessionSummaryTitle(summary);

  if (summary.state === "NOT_APPLICABLE") {
    return {
      symbol: summary.label,
      tone: "not-tracked" as const,
      title
    };
  }

  if (summary.state === "COMPLETE") {
    return {
      symbol: summary.label,
      tone: "ready" as const,
      title
    };
  }

  if (summary.state === "UNKNOWN") {
    return {
      symbol: summary.label,
      tone: "unknown" as const,
      title
    };
  }

  return {
    symbol: summary.label,
    tone: "attention" as const,
    title
  };
}

export function gameplaySignalToken(signal: WeekliesGameplaySignal) {
  return {
    symbol: signal.label,
    tone: weekliesSignalTone(signal.state),
    title: signal.title
  };
}

export function weeklyActionLabel(
  character: WeeklyChecklistCharacter
): string | null {
  if (!isWeeklyGameplayEnabled(character.trackingProfile)) {
    return null;
  }

  return (
    character.weeklyGameplay?.mythicPlusAction ??
    character.weeklyGameplay?.raidAction ??
    character.weeklyGameplay?.delvesAction ??
    character.gameplaySignals.map.actionLabel ??
    character.gameplaySignals.meta.actionLabel ??
    null
  );
}

export { gameplayDomainToken };
