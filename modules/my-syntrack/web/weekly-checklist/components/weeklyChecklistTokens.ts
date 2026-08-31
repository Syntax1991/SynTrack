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
  title: "Progress unresolved"
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
      maxSlots: view.maxSlots
    });
    const unresolved = view.unresolvedCategoryLabels ?? [];
    const unknownNote =
      unresolved.length === 1
        ? ` · ${unresolved[0]} category unresolved`
        : unresolved.length > 1
          ? ` · ${unresolved.join(", ")} categories unresolved`
          : view.hasUnknownCategories && view.unknownCategoryCount > 0
            ? ` · ${view.unknownCategoryCount} category unresolved`
            : view.hasUnknownCategories
              ? " · some categories unresolved"
              : "";

    return {
      symbol,
      tone:
        view.state === "READY"
          ? ("ready" as const)
          : view.hasUnknownCategories
            ? ("unknown" as const)
            : ("attention" as const),
      title: `${view.label} ${symbol}${unknownNote}`
    };
  }

  const fraction = `${view.completeCount}/${view.applicableTotal}`;
  const slotNote =
    view.maxSlots > 0 && view.maxSlots !== view.applicableTotal
      ? ` · Vault slots ${view.knownUnlockedSlots}/${view.maxSlots}`
      : "";

  return {
    symbol: fraction,
    tone:
      view.state === "READY"
        ? ("ready" as const)
        : ("attention" as const),
    title: `${view.label} ${fraction}${slotNote}`
  };
}
