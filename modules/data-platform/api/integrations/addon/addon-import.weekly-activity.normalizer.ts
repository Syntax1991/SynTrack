import {
  asNumber,
  asString,
  asTable,
  numericValues
} from "./addon-import.lua-utils.js";
import type { LuaValue } from "./addon-import.types.js";
import type {
  AddonWeeklyActivitySnapshot,
  AddonWeeklyMythicPlusRun,
  AddonWeeklyRaidEncounter,
  AddonWeeklyRaidLockout,
  AddonWeeklyVaultActivity
} from "./addon-import.weekly-activity.types.js";

export const SUPPORTED_WEEKLY_ACTIVITY_SCHEMA_VERSION = 1;

function asNullableBoolean(
  value: LuaValue | undefined
): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeVaultActivity(
  value: LuaValue
): AddonWeeklyVaultActivity | null {
  const row = asTable(value);
  const type = asNumber(row?.type);

  if (!row || type === null) {
    return null;
  }

  return {
    type,
    typeName: asString(row.typeName),
    index: asNumber(row.index),
    threshold: asNumber(row.threshold),
    progress: asNumber(row.progress),
    activityId: asNumber(row.id),
    level: asNumber(row.level),
    activityTierId: asNumber(row.activityTierID),
    claimId: asNumber(row.claimID)
  };
}

function normalizeMythicPlusRun(
  value: LuaValue
): AddonWeeklyMythicPlusRun | null {
  const row = asTable(value);
  const keyLevel = asNumber(row?.level);

  if (!row || keyLevel === null) {
    return null;
  }

  return {
    mapChallengeModeId: asNumber(row.mapChallengeModeId),
    keyLevel,
    completed: asNullableBoolean(row.completed),
    thisWeek: asNullableBoolean(row.thisWeek),
    durationSec: asNumber(row.durationSec),
    dungeonScore: asNumber(row.dungeonScore)
  };
}

function normalizeRaidEncounter(
  value: LuaValue
): AddonWeeklyRaidEncounter {
  const row = asTable(value);

  return {
    index: asNumber(row?.index),
    name: asString(row?.name),
    isKilled: asNullableBoolean(row?.isKilled)
  };
}

function normalizeRaidLockout(
  value: LuaValue
): AddonWeeklyRaidLockout | null {
  const row = asTable(value);
  const name = asString(row?.name);

  if (!row || !name) {
    return null;
  }

  return {
    name,
    difficulty: asNumber(row.difficulty),
    difficultyName: asString(row.difficultyName),
    encounterProgress: asNumber(row.encounterProgress),
    numEncounters: asNumber(row.numEncounters),
    encounters: numericValues(asTable(row.encounters)).map(
      normalizeRaidEncounter
    )
  };
}

export function normalizeWeeklyActivitySnapshot(
  value: LuaValue | undefined
): AddonWeeklyActivitySnapshot | null {
  const module = asTable(value);
  const data = asTable(module?.data);
  const schemaVersion = asNumber(module?.schemaVersion);

  if (!data || schemaVersion !== SUPPORTED_WEEKLY_ACTIVITY_SCHEMA_VERSION) {
    return null;
  }

  const vault = asTable(data.vault);
  const mythicPlus = asTable(data.mythicPlus);
  const raids = asTable(data.raids);

  return {
    schemaVersion,
    vaultCaptured: asNullableBoolean(vault?.captured) === true,
    vaultGenerated: asNullableBoolean(vault?.generated),
    vaultCurrentPeriod: asNullableBoolean(vault?.currentPeriod),
    vaultCanClaim: asNullableBoolean(vault?.canClaim),
    vaultHasAvailable: asNullableBoolean(vault?.hasAvailable),
    vaultActivities: numericValues(asTable(vault?.activities))
      .map(normalizeVaultActivity)
      .filter((row): row is AddonWeeklyVaultActivity => row !== null),
    mythicPlusCaptured: asNullableBoolean(mythicPlus?.captured) === true,
    mythicPlusRuns: numericValues(asTable(mythicPlus?.runs))
      .map(normalizeMythicPlusRun)
      .filter((row): row is AddonWeeklyMythicPlusRun => row !== null),
    raidCaptured: asNullableBoolean(raids?.captured) === true,
    raids: numericValues(asTable(raids?.raids))
      .map(normalizeRaidLockout)
      .filter((row): row is AddonWeeklyRaidLockout => row !== null)
  };
}
