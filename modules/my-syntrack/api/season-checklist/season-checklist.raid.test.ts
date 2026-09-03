import { describe, expect, it } from "vitest";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import { deriveRaidGoal } from "./season-checklist.evidence.js";

function resolved(key: string, completed: boolean | null) {
  const definition: TrackerDefinitionRow = {
    id: key,
    scopeKey: "MIDNIGHT-S2",
    key,
    name: key,
    valueType: "BOOLEAN",
    resetBehavior: "SEASONAL",
    category: "SEASON_EVIDENCE",
    sortOrder: 1,
    isPinned: false,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const state: CharacterTrackerState | null =
    completed === null
      ? null
      : {
          trackerDefinitionId: key,
          characterId: "char-1",
          periodKey: "ALWAYS",
          state: "RECORDED",
          source: "ADDON",
          value: { valueType: "BOOLEAN", boolean: completed }
        };

  return { definition, state };
}

describe("deriveRaidGoal", () => {
  it("target AOTC (default): conservative partial UNKNOWN and CE preference", () => {
    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", null),
        resolved("season-achievement-63651", false)
      )
    ).toMatchObject({ state: "UNKNOWN", label: "?" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", false),
        resolved("season-achievement-63651", false)
      )
    ).toMatchObject({ state: "INCOMPLETE", label: "✕ AOTC" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", true),
        resolved("season-achievement-63651", false)
      )
    ).toMatchObject({ state: "COMPLETE", label: "✓ AOTC" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", false),
        resolved("season-achievement-63651", true)
      )
    ).toMatchObject({ state: "COMPLETE", label: "✓ CE" });
  });

  it("target CE requires Cutting Edge specifically, AOTC alone is OPEN", () => {
    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", true),
        resolved("season-achievement-63651", false),
        "CE"
      )
    ).toMatchObject({ state: "INCOMPLETE", label: "✕ CE" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", true),
        resolved("season-achievement-63651", true),
        "CE"
      )
    ).toMatchObject({ state: "COMPLETE", label: "✓ CE" });

    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", true),
        resolved("season-achievement-63651", null),
        "CE"
      )
    ).toMatchObject({ state: "UNKNOWN", label: "?" });
  });

  it("target OFF excludes Raid from Status/Action entirely", () => {
    const goal = deriveRaidGoal(
      resolved("season-achievement-63650", false),
      resolved("season-achievement-63651", false),
      "OFF"
    );

    expect(goal.state).toBe("NOT_APPLICABLE");
    expect(goal.label).toBe("—");
    expect(goal.actionLabel).toBeNull();
  });
});
