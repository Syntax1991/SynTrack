import { isWeeklyGameplayEnabled } from "../../../api/character-tracking/domain-applicability.js";
import { weekliesProfessionSummaryTitle } from "../../../api/weekly-checklist/weeklies-profession-summary.mapper.js";
import { formatKnownWeeklyProgressSymbol } from "../../../api/weekly-progress/weekly-progress-display.js";
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

export function progressToken(character: WeeklyChecklistCharacter) {
  let completedKnown = 0;
  let applicableKnown = 0;
  let unknownCount = 0;
  let incomplete = 0;

  if (isWeeklyGameplayEnabled(character.trackingProfile)) {
    const gameplay = character.weeklyGameplay;

    if (!gameplay) {
      unknownCount += 4;
    } else {
      for (const domain of [
        gameplay.vault,
        gameplay.mythicPlus,
        gameplay.raid,
        gameplay.delves
      ]) {
        if (
          domain.state === "UNKNOWN" ||
          domain.applicableTotal <= 0
        ) {
          unknownCount += 1;
          continue;
        }

        applicableKnown += domain.applicableTotal;
        completedKnown += domain.completeCount;
        incomplete +=
          domain.applicableTotal - domain.completeCount;
      }
    }
  }

  if (applicableKnown === 0 && incomplete === 0) {
    return {
      symbol: unknownCount > 0 ? `0 · ${unknownCount}?` : "—",
      tone: "unknown" as const,
      title: "Gameplay weekly progress unresolved"
    };
  }

  return {
    symbol: formatKnownWeeklyProgressSymbol({
      completedKnown,
      applicableKnown,
      unknownCount
    }),
    tone:
      incomplete > 0
        ? ("attention" as const)
        : unknownCount > 0
          ? ("unknown" as const)
          : ("ready" as const),
    title: `Known gameplay weekly progress ${completedKnown}/${applicableKnown}`
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
    null
  );
}

export { gameplayDomainToken };
