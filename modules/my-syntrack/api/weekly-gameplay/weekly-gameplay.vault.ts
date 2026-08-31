import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

export type VaultActivityFamily = "mythic-plus" | "raid" | "world";

export const VAULT_CATEGORIES: VaultActivityFamily[] = [
  "mythic-plus",
  "raid",
  "world"
];

export const SLOTS_PER_VAULT_CATEGORY = 3;

export const VAULT_FAMILY_LABEL: Record<VaultActivityFamily, string> = {
  "mythic-plus": "Dungeon",
  raid: "Raid",
  world: "World"
};

/*
 * Live Enum.WeeklyRewardChestThresholdType:
 * 1 Activities (M+), 3 Raid, 6 World.
 * 4 is AlsoReceive — never World.
 */
const NUMERIC_FAMILY: Record<number, VaultActivityFamily> = {
  1: "mythic-plus",
  3: "raid",
  6: "world"
};

export type VaultActivitySlot = {
  family: VaultActivityFamily;
  index: number | null;
  threshold: number;
  progress: number;
  unlocked: boolean;
  level: number | null;
};

export type VaultCategoryResult = {
  family: VaultActivityFamily;
  known: boolean;
  unlocked: number;
  slots: number;
  progress: number | null;
  finalThreshold: number | null;
  activities: VaultActivitySlot[];
};

function normalizeTypeName(typeName: string | null): string {
  return (typeName ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

export function vaultFamily(
  typeName: string | null,
  type: number | null = null
): VaultActivityFamily | null {
  const name = normalizeTypeName(typeName);

  if (name.includes("raid")) {
    return "raid";
  }

  if (name.includes("world") || name.includes("delve")) {
    return "world";
  }

  if (
    name.includes("activit") ||
    name.includes("mythic") ||
    name.includes("dungeon")
  ) {
    return "mythic-plus";
  }

  if (type !== null && NUMERIC_FAMILY[type]) {
    return NUMERIC_FAMILY[type];
  }

  return null;
}

export function vaultActivitiesAreCurrent(
  snapshot: WeeklyGameplaySnapshotInput
): boolean {
  return snapshot.vaultCaptured && snapshot.vaultCurrentPeriod !== false;
}

export function vaultSlotsForFamily(
  snapshot: WeeklyGameplaySnapshotInput,
  family: VaultActivityFamily
): VaultActivitySlot[] {
  return snapshot.vaultActivities
    .filter(
      (activity) => vaultFamily(activity.typeName, activity.type) === family
    )
    .filter(
      (
        activity
      ): activity is typeof activity & {
        threshold: number;
        progress: number;
      } =>
        activity.threshold !== null &&
        activity.threshold > 0 &&
        activity.progress !== null
    )
    .map((activity) => ({
      family,
      index: activity.index ?? null,
      threshold: activity.threshold,
      progress: activity.progress,
      unlocked: activity.progress >= activity.threshold,
      level: activity.level ?? null
    }))
    .sort((left, right) => left.threshold - right.threshold);
}

export function resolveVaultCategory(
  snapshot: WeeklyGameplaySnapshotInput,
  family: VaultActivityFamily
): VaultCategoryResult {
  const empty: VaultCategoryResult = {
    family,
    known: false,
    unlocked: 0,
    slots: SLOTS_PER_VAULT_CATEGORY,
    progress: null,
    finalThreshold: null,
    activities: []
  };

  if (!vaultActivitiesAreCurrent(snapshot)) {
    return empty;
  }

  const activities = vaultSlotsForFamily(snapshot, family);

  if (activities.length === 0) {
    return empty;
  }

  return {
    family,
    known: true,
    unlocked: activities.filter((slot) => slot.unlocked).length,
    slots: activities.length,
    progress: Math.max(...activities.map((slot) => slot.progress)),
    finalThreshold: Math.max(...activities.map((slot) => slot.threshold)),
    activities
  };
}

export function resolveVaultAggregate(snapshot: WeeklyGameplaySnapshotInput): {
  knownUnlockedSlots: number;
  maxSlots: number;
  unknownCategoryCount: number;
  hasUnknownCategories: boolean;
  unresolvedCategoryLabels: string[];
} {
  const categories = VAULT_CATEGORIES.map((family) =>
    resolveVaultCategory(snapshot, family)
  );
  const known = categories.filter((category) => category.known);
  const unknown = categories.filter((category) => !category.known);

  return {
    knownUnlockedSlots: known.reduce(
      (total, category) => total + category.unlocked,
      0
    ),
    maxSlots: VAULT_CATEGORIES.length * SLOTS_PER_VAULT_CATEGORY,
    unknownCategoryCount: unknown.length,
    hasUnknownCategories: unknown.length > 0,
    unresolvedCategoryLabels: unknown.map(
      (category) => VAULT_FAMILY_LABEL[category.family]
    )
  };
}

export function capturedThresholds(
  snapshot: WeeklyGameplaySnapshotInput,
  family: VaultActivityFamily
): number[] {
  return vaultSlotsForFamily(snapshot, family).map((slot) => slot.threshold);
}

export function thisWeekMythicPlusRuns(
  snapshot: WeeklyGameplaySnapshotInput
): number | null {
  if (!snapshot.mythicPlusCaptured) {
    return null;
  }

  return snapshot.mythicPlusRuns.filter(
    (run) => run.completed !== false && run.thisWeek !== false
  ).length;
}

export function thisWeekRaidKills(
  snapshot: WeeklyGameplaySnapshotInput
): { killed: number; total: number } | null {
  if (!snapshot.raidCaptured) {
    return null;
  }

  const lockouts = [...snapshot.raidLockouts].sort(
    (left, right) => (right.numEncounters ?? 0) - (left.numEncounters ?? 0)
  );
  const primary = lockouts[0];

  if (!primary) {
    return null;
  }

  try {
    const parsed = JSON.parse(primary.encountersJson) as Array<{
      isKilled?: boolean | null;
    }>;

    if (Array.isArray(parsed) && parsed.length > 0) {
      return {
        killed: parsed.filter((encounter) => encounter.isKilled === true)
          .length,
        total: parsed.length
      };
    }
  } catch {
    /* encounterProgress fallback below */
  }

  if (
    primary.encounterProgress !== null &&
    primary.numEncounters !== null &&
    primary.numEncounters > 0
  ) {
    return {
      killed: primary.encounterProgress,
      total: primary.numEncounters
    };
  }

  return null;
}
