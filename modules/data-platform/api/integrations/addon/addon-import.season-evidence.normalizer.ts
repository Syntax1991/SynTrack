import {
  asNumber,
  asTable,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import type {
  AddonSeasonAchievementEvidence,
  AddonSeasonEvidenceSnapshot,
  AddonSeasonQuestEvidence
} from "./addon-import.season-evidence.types.js";
import type { LuaValue } from "./addon-import.types.js";

export const SUPPORTED_SEASON_EVIDENCE_SCHEMA_VERSION = 1;

function nullableBoolean(value: LuaValue | undefined): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeAchievements(
  value: LuaValue | undefined
): Record<string, AddonSeasonAchievementEvidence> {
  const table = asTable(value);

  if (!table) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(table).flatMap(([trackerKey, raw]) => {
      const row = asTable(raw);
      return row
        ? [[trackerKey, {
            trackerKey,
            achievementId: asNumber(row.achievementId),
            completed: nullableBoolean(row.completed)
          }]]
        : [];
    })
  );
}

function normalizeQuests(
  value: LuaValue | undefined
): Record<string, AddonSeasonQuestEvidence> {
  const table = asTable(value);

  if (!table) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(table).flatMap(([trackerKey, raw]) => {
      const row = asTable(raw);
      return row
        ? [[trackerKey, {
            trackerKey,
            questId: asNumber(row.questId),
            flaggedCompleted: nullableBoolean(row.flaggedCompleted)
          }]]
        : [];
    })
  );
}

export function normalizeSeasonEvidenceSnapshot(
  seasonEvidenceModule: LuaValue | undefined
): AddonSeasonEvidenceSnapshot | null {
  const module = asTable(seasonEvidenceModule);

  if (!module) {
    return null;
  }

  const schemaVersion = asNumber(module.schemaVersion) ?? 0;

  if (schemaVersion !== SUPPORTED_SEASON_EVIDENCE_SCHEMA_VERSION) {
    return null;
  }

  const data = asTable(module.data);

  if (!data) {
    return null;
  }

  return {
    schemaVersion,
    capturedAt: unixTimestampToIso(module.capturedAt),
    achievements: normalizeAchievements(data.achievements),
    quests: normalizeQuests(data.quests)
  };
}
