import type { CharacterPersistenceResult } from "./addon-import.persistence.types.js";
import type { AddonResourceSnapshot } from "./addon-import.resource.types.js";

export type SnapshotRow = {
  characterId: string;
  resourceDefinitionId: string;
  quantity: number | null;
  maxQuantity: number | null;
  weeklyQuantity: number | null;
  maxWeeklyQuantity: number | null;
  isCapped: boolean | null;
  isWeeklyCapped: boolean | null;
  discovered: boolean | null;
  accountWide: boolean | null;
  source: string;
  capturedAt: Date;
};

export function createTransaction() {
  const rows = new Map<string, SnapshotRow>();

  const transaction = {
    characterResourceSnapshot: {
      upsert: async (args: {
        where: {
          characterId_resourceDefinitionId: {
            characterId: string;
            resourceDefinitionId: string;
          };
        };
        create: SnapshotRow;
        update: Omit<
          SnapshotRow,
          "characterId" | "resourceDefinitionId"
        >;
      }) => {
        const { characterId, resourceDefinitionId } =
          args.where.characterId_resourceDefinitionId;
        const key = `${characterId}:${resourceDefinitionId}`;
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
    weekliesSignalSnapshots: 0
  };
}

export function snapshot(
  overrides: Partial<AddonResourceSnapshot> = {}
): AddonResourceSnapshot {
  return {
    schemaVersion: 1,
    capturedAt: "2026-08-27T21:12:46.000Z",
    currencies: [],
    items: [],
    ...overrides
  };
}

export function heroDawncrestDefinition() {
  return {
    id: "def-hero-dawncrest",
    key: "hero-dawncrest",
    scopeKey: "MIDNIGHT-S1",
    externalCurrencyId: 3345,
    externalItemId: null,
    name: "Hero Dawncrest",
    category: "UPGRADE" as const,
    resetBehavior: "WEEKLY" as const,
    ownershipScope: "CHARACTER" as const,
    enabled: true,
    sortOrder: 0
  };
}

export function sparkOfTidesDefinition() {
  return {
    id: "def-spark-of-tides",
    key: "spark-of-tides",
    scopeKey: "MIDNIGHT-S1",
    externalCurrencyId: null,
    externalItemId: 274476,
    name: "Spark of Tides",
    category: "CRAFTING_GATE" as const,
    resetBehavior: "WEEKLY" as const,
    ownershipScope: "CHARACTER" as const,
    enabled: true,
    sortOrder: 0
  };
}
