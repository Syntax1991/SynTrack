import { isWeeklyGameplayEnabled } from "../../../api/character-tracking/domain-applicability.js";
import { formatKnownWeeklyProgressSymbol } from "../../../api/weekly-progress/weekly-progress-display.js";
import type {
  ProfessionWeeklyAggregate,
  WeeklyChecklistCharacter
} from "../types/weeklyChecklist.types";
import { gameplayDomainToken } from "./weeklyChecklistTokens";

export function aggregateToken(
  aggregate: ProfessionWeeklyAggregate,
  label: string
) {
  if (aggregate.applicableTotal === 0) {
    return {
      symbol: "—",
      tone: "not-tracked" as const,
      title: `${label} - not tracked`
    };
  }

  if (aggregate.incompleteCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "attention" as const,
      title: `${label} - ${aggregate.incompleteCount} incomplete`
    };
  }

  if (aggregate.unknownCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "unknown" as const,
      title: `${label} - ${aggregate.unknownCount} unknown`
    };
  }

  return {
    symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
    tone: "ready" as const,
    title: `${label} - complete`
  };
}

export function progressToken(character: WeeklyChecklistCharacter) {
  const aggregates = [
    character.professionWeekly.quest,
    character.professionWeekly.treatise,
    character.professionWeekly.drops
  ];

  let completedKnown = 0;
  let applicableKnown = 0;
  let unknownCount = 0;
  let incomplete = 0;

  for (const aggregate of aggregates) {
    if (aggregate.applicableTotal === 0) {
      continue;
    }

    if (
      aggregate.incompleteCount === 0 &&
      aggregate.unknownCount === aggregate.applicableTotal
    ) {
      unknownCount += 1;
      continue;
    }

    if (aggregate.unknownCount > 0 && aggregate.incompleteCount === 0) {
      unknownCount += 1;
      applicableKnown += aggregate.completeCount;
      completedKnown += aggregate.completeCount;
      continue;
    }

    applicableKnown += aggregate.applicableTotal;
    completedKnown += aggregate.completeCount;
    incomplete += aggregate.incompleteCount;
  }

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
        if (domain.state === "UNKNOWN") {
          unknownCount += 1;
        }
      }
    }
  }

  if (applicableKnown === 0 && incomplete === 0) {
    return {
      symbol: unknownCount > 0 ? `0 · ${unknownCount}?` : "—",
      tone: "unknown" as const,
      title: "Weekly progress unresolved"
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
    title: `Known automatic weekly progress ${completedKnown}/${applicableKnown}`
  };
}

export function weeklyActionLabel(
  character: WeeklyChecklistCharacter
): string | null {
  for (const profession of character.professionWeekly.professions) {
    if (profession.treatise?.state === "INCOMPLETE") {
      return `${profession.name} Treatise missing`;
    }

    if (profession.quest?.state === "INCOMPLETE") {
      return `${profession.name} Quest remaining`;
    }

    if (profession.drops?.state === "INCOMPLETE") {
      const remaining =
        (profession.drops.maxValue ?? 0) -
        (profession.drops.currentValue ?? 0);
      return remaining > 0
        ? `${remaining} Knowledge Drop${remaining === 1 ? "" : "s"} remaining`
        : "Knowledge Drops remaining";
    }
  }

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
