import type {
  WeeklyGameplayCharacterView,
  WeeklyGameplayDomainView,
  WeeklyGameplaySnapshotInput
} from "./weekly-gameplay.types.js";
import {
  capturedThresholds,
  mythicPlusThresholds,
  resolveVaultAggregate,
  resolveVaultCategory,
  thisWeekMythicPlusRuns,
  thisWeekRaidKills
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
    unknownCategoryCount: 0
  };
}

function thresholdDomain(
  label: string,
  rawCompleteCount: number,
  thresholds: number[]
): WeeklyGameplayDomainView {
  if (thresholds.length === 0) {
    return unknownDomain(label);
  }

  const applicableTotal = Math.max(...thresholds);
  const completeCount = Math.min(rawCompleteCount, applicableTotal);
  const incomplete = completeCount < applicableTotal;

  return {
    state: incomplete ? "ATTENTION" : "READY",
    completeCount,
    applicableTotal,
    unknownCount: 0,
    label,
    rawCompleteCount,
    knownUnlockedSlots: completeCount,
    maxSlots: applicableTotal,
    hasUnknownCategories: false,
    unknownCategoryCount: 0
  };
}

function deriveMythicPlus(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  const runs = thisWeekMythicPlusRuns(snapshot);

  if (runs === null) {
    return unknownDomain("M+");
  }

  return thresholdDomain("M+", runs, mythicPlusThresholds(snapshot));
}

function deriveRaid(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  const raid = thisWeekRaidKills(snapshot);

  if (!raid) {
    return unknownDomain("Raid");
  }

  const raidThresholds = capturedThresholds(snapshot, "raid");

  if (raidThresholds.length > 0) {
    return thresholdDomain("Raid", raid.killed, raidThresholds);
  }

  const completeCount = Math.min(raid.killed, raid.total);

  return {
    state: completeCount < raid.total ? "ATTENTION" : "READY",
    completeCount,
    applicableTotal: raid.total,
    unknownCount: 0,
    label: "Raid",
    rawCompleteCount: raid.killed,
    knownUnlockedSlots: completeCount,
    maxSlots: raid.total,
    hasUnknownCategories: false,
    unknownCategoryCount: 0
  };
}

function deriveDelves(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  const category = resolveVaultCategory(snapshot, "world");

  if (!category.known) {
    return unknownDomain("Delves");
  }

  return {
    state:
      category.unlocked < category.slots ? "ATTENTION" : "READY",
    completeCount: category.unlocked,
    applicableTotal: category.slots,
    unknownCount: 0,
    label: "Delves",
    rawCompleteCount: category.unlocked,
    knownUnlockedSlots: category.unlocked,
    maxSlots: category.slots,
    hasUnknownCategories: false,
    unknownCategoryCount: 0
  };
}

function deriveVault(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDomainView {
  const aggregate = resolveVaultAggregate(snapshot);

  if (aggregate.maxSlots <= 0 || aggregate.unknownCategoryCount === 3) {
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
    unknownCategoryCount: aggregate.unknownCategoryCount
  };
}

export function deriveWeeklyGameplay(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayCharacterView {
  const mythicPlus = deriveMythicPlus(snapshot);
  const raid = deriveRaid(snapshot);
  const remainingRuns = Math.max(
    0,
    mythicPlus.applicableTotal - mythicPlus.completeCount
  );

  return {
    characterId: snapshot.characterId,
    vault: deriveVault(snapshot),
    mythicPlus,
    raid,
    delves: deriveDelves(snapshot),
    mythicPlusAction:
      mythicPlus.state === "ATTENTION" && remainingRuns > 0
        ? `${remainingRuns} more M+ run${remainingRuns === 1 ? "" : "s"} for Vault slot ${mythicPlusThresholds(snapshot).length}`
        : null,
    raidAction:
      raid.state === "ATTENTION"
        ? `${Math.max(0, raid.applicableTotal - raid.completeCount)} raid bosses remaining`
        : null
  };
}
