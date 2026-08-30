import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

export type VaultActivityFamily = "mythic-plus" | "raid" | "world";

export const VAULT_CATEGORIES: VaultActivityFamily[] = [
  "mythic-plus",
  "raid",
  "world"
];

export const SLOTS_PER_VAULT_CATEGORY = 3;

/*
 * Used only when this-week M+ capture exists but vault activity
 * threshold rows were not captured. Great Vault M+ has used 1/4/8
 * for years; season-specific raid/delve thresholds are not invented.
 */
export const FALLBACK_MYTHIC_PLUS_THRESHOLDS = [1, 4, 8];

export function vaultFamily(
  typeName: string | null,
  type: number | null = null
): VaultActivityFamily | null {
  const name = typeName?.toLowerCase() ?? "";

  if (
    name === "activities" ||
    name === "mythicplus" ||
    name === "dungeon"
  ) {
    return "mythic-plus";
  }

  if (name === "raid") {
    return "raid";
  }

  if (name === "world") {
    return "world";
  }

  if (type === 1) {
    return "mythic-plus";
  }

  if (type === 3) {
    return "raid";
  }

  if (type === 4) {
    return "world";
  }

  return null;
}

export function capturedThresholds(
  snapshot: WeeklyGameplaySnapshotInput,
  family: VaultActivityFamily
): number[] {
  return snapshot.vaultActivities
    .filter(
      (activity) =>
        vaultFamily(activity.typeName, activity.type) === family &&
        activity.threshold !== null &&
        activity.threshold > 0
    )
    .map((activity) => activity.threshold as number)
    .sort((left, right) => left - right);
}

export function mythicPlusThresholds(
  snapshot: WeeklyGameplaySnapshotInput
): number[] {
  const captured = capturedThresholds(snapshot, "mythic-plus");

  if (captured.length > 0) {
    return captured;
  }

  return [...FALLBACK_MYTHIC_PLUS_THRESHOLDS];
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

export function slotsUnlockedForProgress(
  progress: number,
  thresholds: number[]
): number {
  return thresholds.filter((threshold) => progress >= threshold).length;
}

export type VaultCategoryResult = {
  family: VaultActivityFamily;
  known: boolean;
  unlocked: number;
  slots: number;
};

function slotsForFamily(thresholds: number[]): number {
  return thresholds.length > 0
    ? thresholds.length
    : SLOTS_PER_VAULT_CATEGORY;
}

function currentPeriodActivitiesUsable(
  snapshot: WeeklyGameplaySnapshotInput
): boolean {
  return snapshot.vaultCaptured && snapshot.vaultCurrentPeriod === true;
}

function apiUnlockedForFamily(
  snapshot: WeeklyGameplaySnapshotInput,
  family: VaultActivityFamily
): number {
  return snapshot.vaultActivities.filter((activity) => {
    if (vaultFamily(activity.typeName, activity.type) !== family) {
      return false;
    }

    return (
      activity.threshold !== null &&
      activity.progress !== null &&
      activity.progress >= activity.threshold
    );
  }).length;
}

export function resolveVaultCategory(
  snapshot: WeeklyGameplaySnapshotInput,
  family: VaultActivityFamily
): VaultCategoryResult {
  const thresholds = capturedThresholds(snapshot, family);
  const slots = slotsForFamily(thresholds);
  const useApiProgress = currentPeriodActivitiesUsable(snapshot);

  if (family === "mythic-plus") {
    const runs = thisWeekMythicPlusRuns(snapshot);

    if (runs !== null) {
      const defs =
        thresholds.length > 0 ? thresholds : FALLBACK_MYTHIC_PLUS_THRESHOLDS;

      return {
        family,
        known: true,
        unlocked: slotsUnlockedForProgress(runs, defs),
        slots: defs.length
      };
    }

    if (useApiProgress && thresholds.length > 0) {
      return {
        family,
        known: true,
        unlocked: apiUnlockedForFamily(snapshot, family),
        slots
      };
    }

    return { family, known: false, unlocked: 0, slots };
  }

  if (family === "raid") {
    const raid = thisWeekRaidKills(snapshot);

    if (raid && thresholds.length > 0) {
      return {
        family,
        known: true,
        unlocked: slotsUnlockedForProgress(raid.killed, thresholds),
        slots
      };
    }

    if (raid && raid.total > 0 && raid.killed >= raid.total) {
      return {
        family,
        known: true,
        unlocked: SLOTS_PER_VAULT_CATEGORY,
        slots: SLOTS_PER_VAULT_CATEGORY
      };
    }

    if (useApiProgress && thresholds.length > 0) {
      return {
        family,
        known: true,
        unlocked: apiUnlockedForFamily(snapshot, family),
        slots
      };
    }

    return { family, known: false, unlocked: 0, slots };
  }

  if (useApiProgress && thresholds.length > 0) {
    return {
      family,
      known: true,
      unlocked: apiUnlockedForFamily(snapshot, family),
      slots
    };
  }

  return { family, known: false, unlocked: 0, slots };
}

export function resolveVaultAggregate(snapshot: WeeklyGameplaySnapshotInput): {
  knownUnlockedSlots: number;
  maxSlots: number;
  unknownCategoryCount: number;
  hasUnknownCategories: boolean;
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
    maxSlots: categories.reduce((total, category) => total + category.slots, 0),
    unknownCategoryCount: unknown.length,
    hasUnknownCategories: unknown.length > 0
  };
}
