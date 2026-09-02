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
  it("persists scoped facts at ALWAYS and skips unresolved", async () => {
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
        "season-achievement-63650",
        definition("aotc-def", "season-achievement-63650")
      ],
      [
        "season-quest-cracked-keystone",
        definition("cracked-def", "season-quest-cracked-keystone")
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
          },
          ["season-achievement-63650"]: {
            trackerKey: "season-achievement-63650",
            achievementId: 63650,
            accountCompleted: true,
            earnedByCharacter: null
          }
        },
        quests: {
          ["season-quest-cracked-keystone"]: {
            trackerKey: "season-quest-cracked-keystone",
            questId: 92600,
            flaggedCompleted: false
          }
        }
      },
      tracked
    );

    // CHARACTER catalyst: earnedByCharacter false → persist false
    // WARBAND tier: accountCompleted true → persist true
    // CHARACTER aotc: earnedByCharacter null → skip (UNKNOWN)
    // QUEST cracked: false → persist
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.periodKey === "ALWAYS")).toBe(true);
    expect(
      rows.map((row) => [row.trackerDefinitionId, row.booleanValue])
    ).toEqual([
      ["catalyst-def", false],
      ["tier-def", true],
      ["cracked-def", false]
    ]);
    expect(tracked.seasonEvidenceSnapshots).toBe(3);
  });
});
