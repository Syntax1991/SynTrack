import { describe, expect, it } from "vitest";
import { AddonSeasonEvidencePersistence } from "./addon-import.season-evidence.persistence.js";
import type { CharacterPersistenceResult } from "./addon-import.persistence.types.js";
import type { TrackerDefinitionRow } from "../../../../my-syntrack/api/trackers/tracker-repository.types.js";

function definition(id: string, key: string): TrackerDefinitionRow {
  return {
    id,
    scopeKey: "MIDNIGHT-S2",
    key,
    name: key,
    valueType: "BOOLEAN",
    resetBehavior: "SEASONAL",
    category: "SEASON_EVIDENCE",
    sortOrder: 100,
    isPinned: false,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
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

describe("AddonSeasonEvidencePersistence", () => {
  it("persists scoped 97910 facts and ignores legacy 92600 tracker", async () => {
    const rows: Array<Record<string, unknown>> = [];
    const definitions = new Map([
      [
        "season-achievement-62872",
        definition("catalyst-def", "season-achievement-62872")
      ],
      [
        "season-achievement-63473",
        definition("tier-def", "season-achievement-63473")
      ],
      [
        "season-quest-cracked-keystone-97910",
        definition("cracked-def", "season-quest-cracked-keystone-97910")
      ]
    ]);
    const persistence = new AddonSeasonEvidencePersistence({
      findSeasonEvidenceTrackerDefinitions: async () => definitions
    });
    const tracked = result();

    await persistence.persist(
      {
        characterTrackerValue: {
          upsert: async ({ create }: { create: Record<string, unknown> }) => {
            rows.push(create);
            return create;
          }
        }
      } as never,
      "char-1",
      {
        schemaVersion: 2,
        capturedAt: "2026-08-28T12:00:00.000Z",
        achievements: {
          ["season-achievement-62872"]: {
            trackerKey: "season-achievement-62872",
            achievementId: 62872,
            accountCompleted: true,
            earnedByCharacter: false
          },
          ["season-achievement-63473"]: {
            trackerKey: "season-achievement-63473",
            achievementId: 63473,
            accountCompleted: true,
            earnedByCharacter: false
          }
        },
        quests: {
          ["season-quest-cracked-keystone-97910"]: {
            trackerKey: "season-quest-cracked-keystone-97910",
            questId: 97910,
            flaggedCompleted: true
          },
          // Legacy payload key must not resolve through current catalog.
          ["season-quest-cracked-keystone"]: {
            trackerKey: "season-quest-cracked-keystone",
            questId: 92600,
            flaggedCompleted: false
          }
        }
      },
      tracked
    );

    expect(rows).toHaveLength(3);
    expect(
      rows.map((row) => [row.trackerDefinitionId, row.booleanValue])
    ).toEqual([
      ["catalyst-def", false],
      ["tier-def", true],
      ["cracked-def", true]
    ]);
    expect(tracked.seasonEvidenceSnapshots).toBe(3);
  });

  it("fans one raw portal report out to both the legacy Character row and the new Warband row", async () => {
    const rows: Array<Record<string, unknown>> = [];
    const definitions = new Map([
      [
        "season-portal-62437",
        definition("legacy-portal-def", "season-portal-62437")
      ],
      [
        "season-warband-portal-62437-v2",
        definition("warband-portal-def", "season-warband-portal-62437-v2")
      ]
    ]);
    const persistence = new AddonSeasonEvidencePersistence({
      findSeasonEvidenceTrackerDefinitions: async () => definitions
    });
    const tracked = result();

    await persistence.persist(
      {
        characterTrackerValue: {
          upsert: async ({ create }: { create: Record<string, unknown> }) => {
            rows.push(create);
            return create;
          }
        }
      } as never,
      "char-1",
      {
        schemaVersion: 2,
        capturedAt: "2026-09-03T12:00:00.000Z",
        achievements: {
          // Only the addon's own key is present in the raw payload — no
          // Lua change was needed to populate the new Warband tracker.
          ["season-portal-62437"]: {
            trackerKey: "season-portal-62437",
            achievementId: 62437,
            accountCompleted: true,
            earnedByCharacter: false
          }
        },
        quests: {}
      },
      tracked
    );

    expect(rows).toHaveLength(2);
    expect(
      rows.map((row) => [row.trackerDefinitionId, row.booleanValue]).sort()
    ).toEqual([
      // Legacy CHARACTER row keeps earnedByCharacter semantics — untouched.
      ["legacy-portal-def", false],
      // New WARBAND row is populated exclusively from accountCompleted.
      ["warband-portal-def", true]
    ]);
    expect(tracked.seasonEvidenceSnapshots).toBe(2);
  });
});
