import {
  asNumber,
  asString,
  asTable,
  normalizeProfessionKey,
  numericValues,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import type {
  AddonProfessionKnowledgeTreasureEntry,
  AddonProfessionKnowledgeTreasureSnapshot,
  AddonProfessionKnowledgeTreasureSource
} from "./addon-import.profession-knowledge-treasure.types.js";
import type { LuaValue } from "./addon-import.types.js";

export const SUPPORTED_PROFESSION_KNOWLEDGE_TREASURE_SCHEMA_VERSION = 1;

function asNullableBoolean(
  value: LuaValue | undefined
): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeSource(
  value: LuaValue
): AddonProfessionKnowledgeTreasureSource | null {
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
    flaggedCompleted: asNullableBoolean(row.flaggedCompleted)
  };
}

function normalizeEntry(
  value: LuaValue
): AddonProfessionKnowledgeTreasureEntry | null {
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
      (source): source is AddonProfessionKnowledgeTreasureSource =>
        source !== null
    );

  return {
    professionName,
    professionKey: normalizeProfessionKey(professionName),
    sources
  };
}

/*
 * Returns null for a missing/absent knowledgeTreasures table
 * (character never ran this capture, or an unsupported schemaVersion)
 * - absence must never be confused with "confirmed zero treasures".
 */
export function normalizeProfessionKnowledgeTreasureSnapshot(
  knowledgeTreasuresModule: LuaValue | undefined
): AddonProfessionKnowledgeTreasureSnapshot | null {
  const module = asTable(knowledgeTreasuresModule);

  if (!module) {
    return null;
  }

  const schemaVersion = asNumber(module.schemaVersion) ?? 0;

  if (
    schemaVersion !==
    SUPPORTED_PROFESSION_KNOWLEDGE_TREASURE_SCHEMA_VERSION
  ) {
    return null;
  }

  const professions = numericValues(asTable(module.professions))
    .map(normalizeEntry)
    .filter(
      (entry): entry is AddonProfessionKnowledgeTreasureEntry =>
        entry !== null
    );

  return {
    schemaVersion,
    capturedAt: unixTimestampToIso(module.capturedAt),
    professions
  };
}
