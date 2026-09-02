import { describe, expect, it } from "vitest";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import { resolveSeasonAchievementCompletion } from "./season-achievement-evidence.js";
import {
  deriveBooleanEvidenceGoal,
  derivePortalsGoal,
  deriveRaidGoal,
  deriveWarbandBooleanGoal
} from "./season-checklist.evidence.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

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

function signal(
  state: SeasonGoalSignal["state"],
  label: string
): SeasonGoalSignal {
  return {
    key: "tier-visual",
    title: "Tier",
    state,
    label,
    detail: "Tier",
    actionLabel: state === "INCOMPLETE" ? "Earn" : null
  };
}

describe("season achievement scope resolution", () => {
  it("CHARACTER: account complete + not earned by character → incomplete", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, false)
    ).toBe(false);
  });

  it("WARBAND: account complete + not earned by character → complete", () => {
    expect(
      resolveSeasonAchievementCompletion("WARBAND", true, false)
    ).toBe(true);
  });

  it("CHARACTER: account complete + earnedByCharacter nil → unknown", () => {
    expect(
      resolveSeasonAchievementCompletion("CHARACTER", true, null)
    ).toBeNull();
  });

  it("WARBAND: accountCompleted nil → unknown regardless of earnedByCharacter", () => {
    expect(
      resolveSeasonAchievementCompletion("WARBAND", null, true)
    ).toBeNull();
  });
});

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

  it("portals: exact fraction only when all 8 known", () => {
    expect(
      derivePortalsGoal(
        Array.from({ length: 8 }, (_, index) =>
          resolved(`season-portal-${62437 + index}`, null)
        )
      ).label
    ).toBe("?");

    const allKnownPartial = derivePortalsGoal(
      Array.from({ length: 8 }, (_, index) =>
        resolved(
          `season-portal-${62437 + index}`,
          index < 5
        )
      )
    );
    expect(allKnownPartial.state).toBe("INCOMPLETE");
    expect(allKnownPartial.label).toBe("5/8");

    expect(
      derivePortalsGoal(
        Array.from({ length: 8 }, (_, index) =>
          resolved(`season-portal-${62437 + index}`, true)
        )
      ).label
    ).toBe("✓ 8/8");
  });

  it("portals: any UNKNOWN → UNKNOWN, never partial exact fraction", () => {
    const partialUnknown = derivePortalsGoal(
      Array.from({ length: 8 }, (_, index) => {
        if (index < 3) {
          return resolved(`season-portal-${62437 + index}`, true);
        }
        if (index < 5) {
          return resolved(`season-portal-${62437 + index}`, false);
        }
        return resolved(`season-portal-${62437 + index}`, null);
      })
    );

    expect(partialUnknown.state).toBe("UNKNOWN");
    expect(partialUnknown.label).toBe("?");
  });

  it("raid: conservative partial UNKNOWN and CE preference", () => {
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
    ).toMatchObject({ state: "INCOMPLETE", label: "AOTC open" });

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

  it("warband aggregation completes from profession-only character evidence", () => {
    const gameplayA = signal("UNKNOWN", "?");
    const gameplayB = signal("UNKNOWN", "?");
    const professionOnlyC = signal("COMPLETE", "✓");

    const derived = deriveWarbandBooleanGoal(
      [gameplayA, gameplayB, professionOnlyC],
      "tier-visual",
      "Season tier visual",
      "Earn Sssensational!"
    );

    expect(derived.state).toBe("COMPLETE");
    expect(derived.label).toBe("✓");
  });
});
