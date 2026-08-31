import { nextUnmetVaultSlotAction } from "./weekly-gameplay.actions.js";
import type {
  WeeklyGameplayCharacterView,
  WeeklyGameplayDomainView,
  WeeklyGameplaySnapshotInput
} from "./weekly-gameplay.types.js";
import {
  resolveVaultAggregate,
  resolveVaultCategory,
  type VaultCategoryResult
} from "./weekly-gameplay.vault.js";

function unknownDomain(label: string): WeeklyGameplayDomainView {
  return {
    state: "UNKNOWN",
    completeCount: 0,
    applicableTotal: 0,
    unknownCount: 1,
    label,
    rawCompleteCount: 0,
    knownUnlockedSlots: 0,
    maxSlots: 0,
    hasUnknownCategories: false,
    unknownCategoryCount: 0,
    unresolvedCategoryLabels: []
  };
}

function domainFromCategory(
  label: string,
  category: VaultCategoryResult
): WeeklyGameplayDomainView {
  if (
    !category.known ||
    category.finalThreshold === null ||
    category.progress === null
  ) {
    return unknownDomain(label);
  }

  const completeCount = Math.min(category.progress, category.finalThreshold);

  return {
    state: completeCount < category.finalThreshold ? "ATTENTION" : "READY",
    completeCount,
    applicableTotal: category.finalThreshold,
    unknownCount: 0,
    label,
    rawCompleteCount: category.progress,
    knownUnlockedSlots: category.unlocked,
    maxSlots: category.slots,
    hasUnknownCategories: false,
    unknownCategoryCount: 0,
    unresolvedCategoryLabels: []
  };
}

function deriveVault(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  const aggregate = resolveVaultAggregate(snapshot);

  if (aggregate.unknownCategoryCount === 3) {
    return unknownDomain("Vault");
  }

  const state: WeeklyGameplayDomainView["state"] = aggregate.hasUnknownCategories
    ? "IN_PROGRESS"
    : aggregate.knownUnlockedSlots < aggregate.maxSlots
      ? "ATTENTION"
      : "READY";

  return {
    state,
    completeCount: aggregate.knownUnlockedSlots,
    applicableTotal: aggregate.maxSlots,
    unknownCount: aggregate.unknownCategoryCount,
    label: "Vault",
    rawCompleteCount: aggregate.knownUnlockedSlots,
    knownUnlockedSlots: aggregate.knownUnlockedSlots,
    maxSlots: aggregate.maxSlots,
    hasUnknownCategories: aggregate.hasUnknownCategories,
    unknownCategoryCount: aggregate.unknownCategoryCount,
    unresolvedCategoryLabels: aggregate.unresolvedCategoryLabels
  };
}

export function deriveWeeklyGameplay(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayCharacterView {
  const mythicPlusCategory = resolveVaultCategory(snapshot, "mythic-plus");
  const raidCategory = resolveVaultCategory(snapshot, "raid");
  const worldCategory = resolveVaultCategory(snapshot, "world");
  const mythicPlus = domainFromCategory("M+", mythicPlusCategory);
  const raid = domainFromCategory("Raid", raidCategory);
  const delves = domainFromCategory("Delves", worldCategory);

  return {
    characterId: snapshot.characterId,
    vault: deriveVault(snapshot),
    mythicPlus,
    raid,
    delves,
    mythicPlusAction:
      mythicPlus.state === "UNKNOWN"
        ? "Mythic+ progress unresolved"
        : nextUnmetVaultSlotAction(mythicPlusCategory.activities, {
            unitSingular: "M+ run",
            unitPlural: "M+ runs"
          }),
    raidAction:
      raid.state === "UNKNOWN"
        ? null
        : nextUnmetVaultSlotAction(raidCategory.activities, {
            unitSingular: "Raid boss",
            unitPlural: "Raid bosses"
          }),
    delvesAction:
      delves.state === "UNKNOWN"
        ? "Delves Vault progress unresolved"
        : nextUnmetVaultSlotAction(worldCategory.activities, {
            unitSingular: "World activity",
            unitPlural: "World activities"
          })
  };
}
