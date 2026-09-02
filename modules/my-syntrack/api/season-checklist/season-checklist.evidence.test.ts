import { describe, expect, it } from "vitest";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import {
  deriveBooleanEvidenceGoal,
  derivePortalsGoal,
  deriveRaidGoal
} from "./season-checklist.evidence.js";

function resolved(
  key: string,
  completed: boolean | null
) {
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
  const state: CharacterTrackerState | null = completed === null
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

describe("season evidence derivation", () => {
  it("derives boolean complete, incomplete and unknown", () => {
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-62872", true)
      ).state
    ).toBe("COMPLETE");
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-62872", false)
      ).state
    ).toBe("INCOMPLETE");
    expect(
      deriveBooleanEvidenceGoal(
        resolved("season-achievement-62872", null)
      ).state
    ).toBe("UNKNOWN");
  });

  it("counts portals and preserves all-unknown", () => {
    expect(
      derivePortalsGoal(
        Array.from({ length: 8 }, (_, index) =>
          resolved(`season-portal-${62437 + index}`, null)
        )
      ).label
    ).toBe("?");

    const partial = derivePortalsGoal(
      Array.from({ length: 8 }, (_, index) =>
        resolved(
          `season-portal-${62437 + index}`,
          index < 5 ? true : null
        )
      )
    );
    expect(partial.state).toBe("INCOMPLETE");
    expect(partial.label).toBe("5/8");

    expect(
      derivePortalsGoal(
        Array.from({ length: 8 }, (_, index) =>
          resolved(`season-portal-${62437 + index}`, true)
        )
      ).label
    ).toBe("✓ 8/8");
  });

  it("prefers CE then AOTC and otherwise exposes open or unknown", () => {
    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", true),
        resolved("season-achievement-63651", true)
      ).label
    ).toBe("✓ CE");
    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", true),
        resolved("season-achievement-63651", false)
      ).label
    ).toBe("✓ AOTC");
    expect(
      deriveRaidGoal(
        resolved("season-achievement-63650", false),
        resolved("season-achievement-63651", false)
      ).label
    ).toBe("AOTC open");
    expect(deriveRaidGoal(null, null).label).toBe("?");
  });
});
