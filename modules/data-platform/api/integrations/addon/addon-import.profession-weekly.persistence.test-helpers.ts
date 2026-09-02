import type { CharacterPersistenceResult } from "./addon-import.persistence.types.js";
import type {
  AddonProfessionWeeklySnapshot,
  AddonProfessionWeeklySource
} from "./addon-import.profession-weekly.types.js";

export type SnapshotRow = {
  characterId: string;
  sourceDefinitionId: string;
  periodKey: string;
  state: string;
  flaggedCompleted: boolean | null;
  externalQuestId: number | null;
  currentValue: number | null;
  maxValue: number | null;
  source: string;
  capturedAt: Date;
};

export function createTransaction() {
  const rows = new Map<string, SnapshotRow>();

  const transaction = {
    characterProfessionWeeklySnapshot: {
      upsert: async (args: {
        where: {
          characterId_sourceDefinitionId_periodKey: {
            characterId: string;
            sourceDefinitionId: string;
            periodKey: string;
          };
        };
        create: SnapshotRow;
        update: Omit<
          SnapshotRow,
          "characterId" | "sourceDefinitionId" | "periodKey"
        >;
      }) => {
        const {
          characterId,
          sourceDefinitionId,
          periodKey
        } =
          args.where
            .characterId_sourceDefinitionId_periodKey;

        const key = `${characterId}:${sourceDefinitionId}:${periodKey}`;
        const existing = rows.get(key);

        const row: SnapshotRow = existing
          ? { ...existing, ...args.update }
          : { ...args.create };

        rows.set(key, row);
        return row;
      }
    }
  };

  return { transaction, rows };
}

export function result(): CharacterPersistenceResult {
  return {
    characters: 0,
    professionAssignments: 0,
    progressEntries: 0,
    gearSlots: 0,
    resourceSnapshots: 0,
    professionWeeklySnapshots: 0,
    professionKnowledgeTreasureSnapshots: 0,
    weeklyGameplaySnapshots: 0,
    weekliesSignalSnapshots: 0,
    seasonEvidenceSnapshots: 0
  };
}

export function source(
  overrides: Partial<AddonProfessionWeeklySource> = {}
): AddonProfessionWeeklySource {
  return {
    sourceKey: "weekly-quest",
    externalQuestId: 93528,
    flaggedCompleted: true,
    currentValue: null,
    maxValue: null,
    ...overrides
  };
}

export function snapshot(
  overrides: Partial<AddonProfessionWeeklySnapshot> = {}
): AddonProfessionWeeklySnapshot {
  return {
    schemaVersion: 1,
    capturedAt: "2026-08-28T12:00:00.000Z",
    professions: [],
    ...overrides
  };
}

export function weeklyQuestDefinition(
  overrides: Partial<{
    id: string;
    professionKey: string;
    sourceKey: string;
    enabled: boolean;
  }> = {}
) {
  return {
    id: overrides.id ?? "def-alchemy-weekly-quest",
    scopeKey: "MIDNIGHT-S2",
    professionKey: overrides.professionKey ?? "alchemy",
    sourceKey: overrides.sourceKey ?? "weekly-quest",
    name: "Weekly Quest",
    sourceType: "WEEKLY_QUEST" as const,
    externalQuestId: 93528,
    externalCurrencyId: null,
    enabled: overrides.enabled ?? true,
    sortOrder: 0
  };
}

export function treatiseDefinition(
  overrides: Partial<{
    id: string;
    professionKey: string;
  }> = {}
) {
  return {
    id: overrides.id ?? "def-alchemy-treatise",
    scopeKey: "MIDNIGHT-S2",
    professionKey: overrides.professionKey ?? "alchemy",
    sourceKey: "treatise",
    name: "Treatise",
    sourceType: "TREATISE" as const,
    externalQuestId: 95127,
    externalCurrencyId: null,
    enabled: true,
    sortOrder: 1
  };
}

export function knowledgeDropsDefinition(
  overrides: Partial<{
    id: string;
    professionKey: string;
    sourceKey: string;
  }> = {}
) {
  return {
    id: overrides.id ?? "def-alchemy-drops",
    scopeKey: "MIDNIGHT-S2",
    professionKey: overrides.professionKey ?? "alchemy",
    sourceKey: overrides.sourceKey ?? "knowledge-drops-1",
    name: "Knowledge Drops",
    sourceType: "KNOWLEDGE_DROPS" as const,
    externalQuestId: 93528,
    externalCurrencyId: null,
    enabled: true,
    sortOrder: 2
  };
}
