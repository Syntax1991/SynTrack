import type { CharacterPersistenceResult } from "./addon-import.persistence.types.js";
import type {
  AddonProfessionKnowledgeTreasureSnapshot,
  AddonProfessionKnowledgeTreasureSource
} from "./addon-import.profession-knowledge-treasure.types.js";

export type SnapshotRow = {
  characterId: string;
  definitionId: string;
  state: string;
  flaggedCompleted: boolean | null;
  externalQuestId: number | null;
  source: string;
  capturedAt: Date;
};

export function createTransaction() {
  const rows = new Map<string, SnapshotRow>();

  const keyFor = (characterId: string, definitionId: string) =>
    `${characterId}:${definitionId}`;

  const transaction = {
    characterProfessionKnowledgeTreasureSnapshot: {
      findUnique: async (args: {
        where: {
          characterId_definitionId: {
            characterId: string;
            definitionId: string;
          };
        };
      }) => {
        const {
          characterId,
          definitionId
        } = args.where.characterId_definitionId;

        return (
          rows.get(keyFor(characterId, definitionId)) ?? null
        );
      },
      upsert: async (args: {
        where: {
          characterId_definitionId: {
            characterId: string;
            definitionId: string;
          };
        };
        create: SnapshotRow;
        update: Omit<
          SnapshotRow,
          "characterId" | "definitionId"
        >;
      }) => {
        const {
          characterId,
          definitionId
        } = args.where.characterId_definitionId;

        const key = keyFor(characterId, definitionId);
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
  overrides: Partial<AddonProfessionKnowledgeTreasureSource> = {}
): AddonProfessionKnowledgeTreasureSource {
  return {
    sourceKey: "treasure-1",
    externalQuestId: 89115,
    flaggedCompleted: true,
    ...overrides
  };
}

export function snapshot(
  overrides: Partial<AddonProfessionKnowledgeTreasureSnapshot> = {}
): AddonProfessionKnowledgeTreasureSnapshot {
  return {
    schemaVersion: 1,
    capturedAt: "2026-08-28T12:00:00.000Z",
    professions: [],
    ...overrides
  };
}

export function treasureDefinition(
  overrides: Partial<{
    id: string;
    professionKey: string;
    sourceKey: string;
  }> = {}
) {
  return {
    id: overrides.id ?? "def-alchemy-treasure-1",
    scopeKey: "MIDNIGHT-S2",
    professionKey: overrides.professionKey ?? "alchemy",
    sourceKey: overrides.sourceKey ?? "treasure-1",
    name: "Treasure",
    externalQuestId: 89115,
    knowledgePoints: 3,
    enabled: true,
    sortOrder: 0
  };
}
