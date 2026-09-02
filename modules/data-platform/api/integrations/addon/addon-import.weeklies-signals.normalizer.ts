import {
  asNumber,
  asTable,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import type { LuaValue } from "./addon-import.types.js";
import type {
  AddonWeekliesMythicPlusRatingCapture,
  AddonWeekliesQuestSignal,
  AddonWeekliesSignalsSnapshot
} from "./addon-import.weeklies-signals.types.js";

export const SUPPORTED_WEEKLIES_SIGNALS_SCHEMA_VERSION = 1;

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

export function normalizeWeekliesSignalsSnapshot(
  weekliesSignalsModule: LuaValue | undefined
): AddonWeekliesSignalsSnapshot | null {
  const module = asTable(weekliesSignalsModule);

  if (!module) {
    return null;
  }

  const schemaVersion = asNumber(module.schemaVersion) ?? 0;

  if (
    schemaVersion !== SUPPORTED_WEEKLIES_SIGNALS_SCHEMA_VERSION
  ) {
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
    metaQuest: normalizeQuestSignal(
      data.metaQuest,
      "meta-quest"
    )
  };
}
