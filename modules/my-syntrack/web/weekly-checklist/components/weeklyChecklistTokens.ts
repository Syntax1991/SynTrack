import { isWeeklyGameplayEnabled } from "../../../api/character-tracking/domain-applicability.js";
import { formatVaultSlotSymbol } from "../../../api/weekly-progress/weekly-progress-display.js";
import type { WeeklyChecklistCharacter } from "../types/weeklyChecklist.types";

const disabledActivityToken = {
  symbol: "—",
  tone: "not-tracked" as const,
  title: "Not applicable for this character profile"
};

const unknownActivityToken = {
  symbol: "?",
  tone: "unknown" as const,
  title: "Not automatically tracked yet"
};

export function gameplayDomainToken(
  character: WeeklyChecklistCharacter,
  domain: "vault" | "mythicPlus" | "raid" | "delves"
) {
  if (!isWeeklyGameplayEnabled(character.trackingProfile)) {
    return disabledActivityToken;
  }

  const view = character.weeklyGameplay?.[domain];

  if (!view || view.state === "UNKNOWN") {
    return unknownActivityToken;
  }

  if (view.applicableTotal <= 0) {
    return unknownActivityToken;
  }

  if (domain === "vault") {
    const symbol = formatVaultSlotSymbol({
      knownUnlockedSlots: view.knownUnlockedSlots,
      maxSlots: view.maxSlots,
      hasUnknownCategories: view.hasUnknownCategories
    });

    return {
      symbol,
      tone:
        view.state === "READY"
          ? ("ready" as const)
          : view.hasUnknownCategories
            ? ("unknown" as const)
            : ("attention" as const),
      title: `${view.label} ${symbol}`
    };
  }

  return {
    symbol: `${view.completeCount}/${view.applicableTotal}`,
    tone:
      view.state === "READY"
        ? ("ready" as const)
        : ("attention" as const),
    title: `${view.label} ${view.completeCount}/${view.applicableTotal}`
  };
}
