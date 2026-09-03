import {
  asNumber,
  asTable,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import type { LuaValue } from "./addon-import.types.js";
import type {
  AddonWeekliesMetaQuestEvidence,
  AddonWeekliesMetaQuestSignal,
  AddonWeekliesMythicPlusRatingCapture,
  AddonWeekliesQuestSignal,
  AddonWeekliesSignalsSnapshot
} from "./addon-import.weeklies-signals.types.js";

/** schemaVersion 1: aggregate only. schemaVersion 2: + per-quest evidence. */
export const SUPPORTED_WEEKLIES_SIGNALS_SCHEMA_VERSIONS = new Set([
  1, 2
]);

function asNullableBoolean(
  value: LuaValue | undefined
): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeRatingCapture(
  value: LuaValue | undefined
): AddonWeekliesMythicPlusRatingCapture {
  const row = asTable(value);

  if (!row) {
    return {
      captured: false,
      seasonRating: null
    };
  }

  return {
    captured: row.captured === true,
    seasonRating: asNumber(row.seasonRating)
  };
}

function normalizeQuestSignal(
  value: LuaValue | undefined,
  fallbackKey: string
): AddonWeekliesQuestSignal {
  const row = asTable(value);

  if (!row) {
    return {
      signalKey: fallbackKey,
      externalQuestId: null,
      flaggedCompleted: null
    };
  }

  return {
    signalKey:
      typeof row.signalKey === "string"
        ? row.signalKey
        : fallbackKey,
    externalQuestId: asNumber(row.externalQuestId),
    flaggedCompleted: asNullableBoolean(row.flaggedCompleted)
  };
}

function normalizeMetaEvidence(
  value: LuaValue | undefined
): AddonWeekliesMetaQuestEvidence[] {
  const table = asTable(value);

  if (!table) {
    return [];
  }

  return Object.entries(table).flatMap(([key, raw]) => {
    const questId = Number(key);

    if (!Number.isFinite(questId)) {
      return [];
    }

    return [
      {
        questId,
        flaggedCompleted: asNullableBoolean(raw as LuaValue)
      }
    ];
  });
}

function normalizeMetaQuestSignal(
  value: LuaValue | undefined
): AddonWeekliesMetaQuestSignal {
  const base = normalizeQuestSignal(value, "meta-quest");
  const row = asTable(value);

  return {
    ...base,
    evidence: normalizeMetaEvidence(row?.evidence)
  };
}

export function normalizeWeekliesSignalsSnapshot(
  weekliesSignalsModule: LuaValue | undefined
): AddonWeekliesSignalsSnapshot | null {
  const module = asTable(weekliesSignalsModule);

  if (!module) {
    return null;
  }

  const schemaVersion = asNumber(module.schemaVersion) ?? 0;

  if (!SUPPORTED_WEEKLIES_SIGNALS_SCHEMA_VERSIONS.has(schemaVersion)) {
    return null;
  }

  const data = asTable(module.data);

  if (!data) {
    return null;
  }

  return {
    schemaVersion,
    capturedAt: unixTimestampToIso(module.capturedAt),
    mythicPlusRating: normalizeRatingCapture(
      data.mythicPlusRating
    ),
    troveHuntersBountyUsed: normalizeQuestSignal(
      data.troveHuntersBountyUsed,
      "trove-hunters-bounty-used"
    ),
    metaQuest: normalizeMetaQuestSignal(data.metaQuest)
  };
}
