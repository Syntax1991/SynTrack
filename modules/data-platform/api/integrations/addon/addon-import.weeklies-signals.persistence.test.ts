import { describe, expect, it } from "vitest";
import { AddonWeekliesSignalsPersistence } from "./addon-import.weeklies-signals.persistence.js";
import type { AddonWeekliesSignalsSnapshot } from "./addon-import.weeklies-signals.types.js";
import type { CharacterPersistenceResult } from "./addon-import.persistence.types.js";

type TrackerValueRow = {
  trackerDefinitionId: string;
  characterId: string;
  periodKey: string;
  booleanValue: boolean | null;
  numberValue: number | null;
  source: string;
};

function definitions() {
  return {
    mythicPlusRating: {
      id: "rating-def",
      scopeKey: "SEASON-MIDNIGHT",
      key: "mythic-plus-rating",
      name: "Mythic+ Rating (2,000)",
      valueType: "NUMBER",
      resetBehavior: "SEASONAL",
      category: "GAMEPLAY",
      sortOrder: 10,
      isPinned: false,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    troveHuntersBountyUsed: {
      id: "bounty-def",
      scopeKey: "SEASON-MIDNIGHT",
      key: "trove-hunters-bounty-used",
      name: "Trove Hunter's Bounty used",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY",
      category: "GAMEPLAY",
      sortOrder: 15,
      isPinned: false,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    metaQuest: {
      id: "meta-def",
      scopeKey: "SEASON-MIDNIGHT",
      key: "meta-quest",
      name: "Weekly Meta Quest",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY",
      category: "GAMEPLAY",
      sortOrder: 20,
      isPinned: false,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };
}

function createTransaction() {
  const rows = new Map<string, TrackerValueRow>();

  const transaction = {
    characterTrackerValue: {
      upsert: async ({
        where,
        create,
        update
      }: {
        where: {
          trackerDefinitionId_characterId_periodKey: {
            trackerDefinitionId: string;
            characterId: string;
            periodKey: string;
          };
        };
        create: TrackerValueRow;
        update: Partial<TrackerValueRow>;
      }) => {
        const key = `${where.trackerDefinitionId_characterId_periodKey.trackerDefinitionId}:${where.trackerDefinitionId_characterId_periodKey.characterId}:${where.trackerDefinitionId_characterId_periodKey.periodKey}`;
        const existing = rows.get(key);
        const next = {
          ...(existing ?? create),
          ...update
        };

        rows.set(key, next as TrackerValueRow);
        return next;
      }
    }
  };

  return { transaction, rows };
}

function snapshot(
  overrides: Partial<AddonWeekliesSignalsSnapshot> = {}
): AddonWeekliesSignalsSnapshot {
  return {
    schemaVersion: 1,
    capturedAt: "2026-08-28T12:00:00.000Z",
    mythicPlusRating: {
      captured: true,
      seasonRating: 2050
    },
    troveHuntersBountyUsed: {
      signalKey: "trove-hunters-bounty-used",
      externalQuestId: 86371,
      flaggedCompleted: true
    },
    metaQuest: {
      signalKey: "meta-quest",
      externalQuestId: 95520,
      flaggedCompleted: false
    },
    ...overrides
  };
}

function result(): CharacterPersistenceResult {
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

describe("AddonWeekliesSignalsPersistence", () => {
  it("persists seasonal mythic plus rating and weekly bounty/meta flags", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonWeekliesSignalsPersistence({
      findWeekliesTrackerDefinitions: async () => definitions()
    });
    const trackResult = result();

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot(),
      trackResult
    );

    expect(trackResult.weekliesSignalSnapshots).toBe(3);
    expect(rows.get("rating-def:char-1:ALWAYS")?.numberValue).toBe(
      2050
    );
    expect(
      rows.get("bounty-def:char-1:2026-08-26")?.booleanValue
    ).toBe(true);
    expect(
      rows.get("meta-def:char-1:2026-08-26")?.booleanValue
    ).toBe(false);
    expect(
      rows.get("rating-def:char-1:ALWAYS")?.source
    ).toBe("ADDON");
  });

  it("skips rating persistence when capture evidence is missing", async () => {
    const { transaction, rows } = createTransaction();
    const persistence = new AddonWeekliesSignalsPersistence({
      findWeekliesTrackerDefinitions: async () => definitions()
    });

    await persistence.persist(
      transaction as never,
      "char-1",
      snapshot({
        mythicPlusRating: {
          captured: false,
          seasonRating: null
        }
      }),
      result()
    );

    expect(rows.size).toBe(2);
    expect(
      [...rows.values()].some((row) => row.numberValue !== null)
    ).toBe(false);
  });
});
