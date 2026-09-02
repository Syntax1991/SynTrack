import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AddonSeasonEvidencePersistence } from "./addon-import.season-evidence.persistence.js";
import type { CharacterPersistenceResult } from "./addon-import.persistence.types.js";
import type { TrackerDefinitionRow } from "../../../../my-syntrack/api/trackers/tracker-repository.types.js";
import { resolveSeasonAchievementCompletion } from "../../../../my-syntrack/api/season-checklist/season-achievement-evidence.js";
import { deriveBooleanEvidenceGoal } from "../../../../my-syntrack/api/season-checklist/season-checklist.evidence.js";
import { primarySeasonEvidenceForGoal } from "../../../../my-syntrack/api/season-checklist/season-evidence-catalog.js";
import type { TrackerDefinitionRow as DefRow } from "../../../../my-syntrack/api/trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../../../../my-syntrack/api/trackers/tracker.types.js";

const here = dirname(fileURLToPath(import.meta.url));
const seasonEvidenceLua = join(
  here,
  "../../../addons/SynTrack_Core/SeasonEvidence.lua"
);

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

function resolved(completed: boolean | null) {
  const key = "season-achievement-63326";
  const def: DefRow = definition(key, key);
  const state: CharacterTrackerState | null =
    completed === null
      ? null
      : {
          trackerDefinitionId: key,
          characterId: "synblast",
          periodKey: "ALWAYS",
          state: "RECORDED",
          source: "ADDON",
          value: { valueType: "BOOLEAN", boolean: completed }
        };

  return { definition: def, state };
}

describe("Nemesis 63326 evidence resolution", () => {
  it("catalog maps Nemesis to CHARACTER achievement 63326", () => {
    const evidence = primarySeasonEvidenceForGoal("nemesis-aztarec");
    expect(evidence).toMatchObject({
      trackerKey: "season-achievement-63326",
      externalId: 63326,
      evidenceKind: "ACHIEVEMENT",
      scope: "CHARACTER",
      goalKey: "nemesis-aztarec"
    });
  });

  it("false earnedByCharacter → INCOMPLETE open (not unknown)", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, false)
    ).toBe(false);
    expect(deriveBooleanEvidenceGoal(resolved(false)).state).toBe(
      "INCOMPLETE"
    );
    expect(deriveBooleanEvidenceGoal(resolved(false)).actionLabel).toBe(
      "Defeat Azta'rec on ??"
    );
  });

  it("true earnedByCharacter → COMPLETE", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, true)
    ).toBe(true);
    expect(deriveBooleanEvidenceGoal(resolved(true)).state).toBe(
      "COMPLETE"
    );
  });

  it("unresolved earnedByCharacter → UNKNOWN (no invented false)", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, null)
    ).toBeNull();
    expect(deriveBooleanEvidenceGoal(resolved(null)).state).toBe(
      "UNKNOWN"
    );
  });

  it("account true + character false stays incomplete for CHARACTER scope", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, false)
    ).toBe(false);
  });

  it("addon capture preserves boolean false (no and/or nil collapse)", () => {
    const lua = readFileSync(seasonEvidenceLua, "utf8");
    expect(lua).toMatch(/local function booleanOrNil/);
    expect(lua).not.toMatch(
      /type\([^)]+\) == "boolean" and [^ ]+ or nil/
    );
  });

  it("persists Nemesis false from earnedByCharacter without inventing complete", async () => {
    const rows: Array<Record<string, unknown>> = [];
    const persistence = new AddonSeasonEvidencePersistence({
      findSeasonEvidenceTrackerDefinitions: async () =>
        new Map([
          [
            "season-achievement-63326",
            definition("nemesis-def", "season-achievement-63326")
          ]
        ])
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
      "synblast",
      {
        schemaVersion: 2,
        capturedAt: "2026-09-03T00:00:00.000Z",
        achievements: {
          ["season-achievement-63326"]: {
            trackerKey: "season-achievement-63326",
            achievementId: 63326,
            accountCompleted: true,
            earnedByCharacter: false
          }
        },
        quests: {}
      },
      tracked
    );

    expect(rows).toEqual([
      expect.objectContaining({
        trackerDefinitionId: "nemesis-def",
        booleanValue: false,
        source: "ADDON"
      })
    ]);
    expect(tracked.seasonEvidenceSnapshots).toBe(1);
  });

  it("skips persistence when earnedByCharacter unresolved", async () => {
    const rows: Array<Record<string, unknown>> = [];
    const persistence = new AddonSeasonEvidencePersistence({
      findSeasonEvidenceTrackerDefinitions: async () =>
        new Map([
          [
            "season-achievement-63326",
            definition("nemesis-def", "season-achievement-63326")
          ]
        ])
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
      "synblast",
      {
        schemaVersion: 2,
        capturedAt: "2026-09-03T00:00:00.000Z",
        achievements: {
          ["season-achievement-63326"]: {
            trackerKey: "season-achievement-63326",
            achievementId: 63326,
            accountCompleted: true,
            earnedByCharacter: null
          }
        },
        quests: {}
      },
      tracked
    );

    expect(rows).toHaveLength(0);
    expect(tracked.seasonEvidenceSnapshots).toBe(0);
  });
});
