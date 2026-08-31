import { nextUnmetVaultSlotAction } from "./weekly-gameplay.actions.js";
import { deriveWeeklyGameplay } from "./weekly-gameplay.deriver.js";
import { highestCompletedKeyLevel } from "./weekly-gameplay.highest.js";
import type {
  WeeklyGameplayCharacterView,
  WeeklyGameplaySnapshotInput
} from "./weekly-gameplay.types.js";
import {
  resolveVaultCategory,
  thisWeekMythicPlusRuns,
  type VaultActivityFamily,
  type VaultActivitySlot,
  type VaultCategoryResult
} from "./weekly-gameplay.vault.js";

export type VaultSlotState = "UNLOCKED" | "LOCKED" | "UNKNOWN";

export type VaultSlotDetailView = {
  slot: 1 | 2 | 3;
  state: VaultSlotState;
  threshold: number | null;
  progress: number | null;
  level: number | null;
  rewardLabel: string | null;
};

export type MythicPlusRunDetailView = {
  mapChallengeModeId: number | null;
  keyLevel: number;
  completed: boolean | null;
  thisWeek: boolean | null;
  durationSec: number | null;
};

export type WeeklyGameplayDetailView = {
  gameplay: WeeklyGameplayCharacterView;
  mythicPlusSlots: VaultSlotDetailView[];
  raidSlots: VaultSlotDetailView[];
  worldSlots: VaultSlotDetailView[];
  highestKeyLevel: number | null;
  mythicPlusRunCount: number | null;
  mythicPlusRuns: MythicPlusRunDetailView[];
  action: string;
  vaultCaptured: boolean;
  vaultCurrent: boolean;
};

const RAID_DIFFICULTY_LABEL: Record<number, string> = {
  14: "Normal",
  15: "Heroic",
  16: "Mythic"
};

export function formatVaultRewardLabel(
  family: VaultActivityFamily,
  level: number | null
): string | null {
  if (level === null || level <= 0) {
    return null;
  }

  if (family === "mythic-plus") {
    return `+${level}`;
  }

  if (family === "raid") {
    return RAID_DIFFICULTY_LABEL[level] ?? `Difficulty ${level}`;
  }

  return `Tier ${level}`;
}

function slotFromActivity(
  family: VaultActivityFamily,
  activity: VaultActivitySlot,
  slot: 1 | 2 | 3
): VaultSlotDetailView {
  return {
    slot,
    state: activity.unlocked ? "UNLOCKED" : "LOCKED",
    threshold: activity.threshold,
    progress: activity.progress,
    level: activity.level,
    rewardLabel: formatVaultRewardLabel(family, activity.level)
  };
}

function unknownSlot(slot: 1 | 2 | 3): VaultSlotDetailView {
  return {
    slot,
    state: "UNKNOWN",
    threshold: null,
    progress: null,
    level: null,
    rewardLabel: null
  };
}

export function slotsFromCategory(
  family: VaultActivityFamily,
  category: VaultCategoryResult
): VaultSlotDetailView[] {
  if (!category.known) {
    return [1, 2, 3].map((slot) => unknownSlot(slot as 1 | 2 | 3));
  }

  const details = category.activities
    .slice(0, 3)
    .map((activity, index) =>
      slotFromActivity(family, activity, (index + 1) as 1 | 2 | 3)
    );

  while (details.length < 3) {
    details.push(unknownSlot((details.length + 1) as 1 | 2 | 3));
  }

  return details;
}

export function resolveGameplayOnlyAction(
  gameplay: WeeklyGameplayCharacterView
): string {
  if (
    gameplay.vault.state === "READY" &&
    !gameplay.vault.hasUnknownCategories
  ) {
    return "Vault complete";
  }

  return (
    gameplay.mythicPlusAction ??
    gameplay.raidAction ??
    gameplay.delvesAction ??
    (gameplay.vault.hasUnknownCategories
      ? "World Vault progress unresolved"
      : "Vault progress unresolved")
  );
}

export function deriveWeeklyGameplayDetail(
  snapshot: WeeklyGameplaySnapshotInput
): WeeklyGameplayDetailView {
  const gameplay = deriveWeeklyGameplay(snapshot);
  const mythicPlusCategory = resolveVaultCategory(snapshot, "mythic-plus");
  const raidCategory = resolveVaultCategory(snapshot, "raid");
  const worldCategory = resolveVaultCategory(snapshot, "world");
  const runCount = thisWeekMythicPlusRuns(snapshot);

  return {
    gameplay,
    mythicPlusSlots: slotsFromCategory("mythic-plus", mythicPlusCategory),
    raidSlots: slotsFromCategory("raid", raidCategory),
    worldSlots: slotsFromCategory("world", worldCategory),
    highestKeyLevel: highestCompletedKeyLevel(snapshot),
    mythicPlusRunCount: runCount,
    mythicPlusRuns: snapshot.mythicPlusRuns
      .filter((run) => run.thisWeek !== false)
      .map((run) => ({
        mapChallengeModeId: run.mapChallengeModeId ?? null,
        keyLevel: run.keyLevel,
        completed: run.completed,
        thisWeek: run.thisWeek,
        durationSec: run.durationSec ?? null
      }))
      .sort((left, right) => right.keyLevel - left.keyLevel),
    action: resolveGameplayOnlyAction(gameplay),
    vaultCaptured: snapshot.vaultCaptured,
    vaultCurrent:
      mythicPlusCategory.known ||
      raidCategory.known ||
      worldCategory.known
  };
}

export function nextUnmetSlotSummary(
  slots: VaultActivitySlot[],
  wording: { unitSingular: string; unitPlural: string }
): string | null {
  return nextUnmetVaultSlotAction(slots, wording);
}
