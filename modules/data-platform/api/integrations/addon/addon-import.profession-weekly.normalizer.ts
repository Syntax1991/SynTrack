import {
  asNumber,
  asString,
  asTable,
  normalizeProfessionKey,
  numericValues,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import type {
  AddonProfessionWeeklyEntry,
  AddonProfessionWeeklySnapshot,
  AddonProfessionWeeklySource
} from "./addon-import.profession-weekly.types.js";
import type { LuaValue } from "./addon-import.types.js";

export const SUPPORTED_PROFESSION_WEEKLY_SCHEMA_VERSION = 1;

function asNullableBoolean(
  value: LuaValue | undefined
): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeSource(
  value: LuaValue
): AddonProfessionWeeklySource | null {
  const row = asTable(value);

  if (!row) {
    return null;
  }

  const sourceKey = asString(row.sourceKey);

  if (!sourceKey) {
    return null;
  }

  return {
    sourceKey,
    externalQuestId: asNumber(row.externalQuestId),
    flaggedCompleted: asNullableBoolean(row.flaggedCompleted),
    currentValue: asNumber(row.currentValue),
    maxValue: asNumber(row.maxValue)
  };
}

function normalizeEntry(
  value: LuaValue
): AddonProfessionWeeklyEntry | null {
  const row = asTable(value);

  if (!row) {
    return null;
  }

  const professionName = asString(row.professionName);

  if (!professionName) {
    return null;
  }

  const sources = numericValues(asTable(row.sources))
    .map(normalizeSource)
    .filter(
      (source): source is AddonProfessionWeeklySource =>
        source !== null
    );

  return {
    professionName,
    professionKey: normalizeProfessionKey(professionName),
    sources
  };
}

/*
 * Returns null for a missing/absent professionWeekly table (character
 * never ran this capture, or an unsupported schemaVersion) - absence
 * must never be confused with "confirmed zero sources this week".
 */
export function normalizeProfessionWeeklySnapshot(
  professionWeeklyModule: LuaValue | undefined
): AddonProfessionWeeklySnapshot | null {
  const module = asTable(professionWeeklyModule);

  if (!module) {
    return null;
  }

  const schemaVersion = asNumber(module.schemaVersion) ?? 0;

  if (
    schemaVersion !== SUPPORTED_PROFESSION_WEEKLY_SCHEMA_VERSION
  ) {
    return null;
  }

  const professions = numericValues(asTable(module.professions))
    .map(normalizeEntry)
    .filter(
      (entry): entry is AddonProfessionWeeklyEntry =>
        entry !== null
    );

  return {
    schemaVersion,
    capturedAt: unixTimestampToIso(module.capturedAt),
    professions
  };
}
