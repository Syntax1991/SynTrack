import { describe, expect, it } from "vitest";
import type { MythicPlusSeasonProgress } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import type { SeasonGoalPreferenceValue } from "../season-goal-preference/season-goal-preference.types.js";
import {
  buildWarbandNumericGoals,
  deriveWarbandMythicPlusGoal,
  deriveWarbandResilientKeystoneGoal
} from "./season-checklist.warband-numeric.js";

function progress(levels: number[], captured = true): MythicPlusSeasonProgress {
  return {
    captured,
    dungeonBests: levels.map((bestKeyLevel, index) => ({
      mapChallengeModeId: 500 + index,
      bestKeyLevel
    }))
  };
}

function warbandPrefs(
  overrides: Record<string, Partial<SeasonGoalPreferenceValue>> = {}
) {
  const defaults: Record<string, SeasonGoalPreferenceValue> = {
    "warband-mythic-plus-score": {
      enabled: true,
      numericTarget: 2000,
      enumTarget: null
    },
    "warband-resilient-keystone": {
      enabled: false,
      numericTarget: null,
      enumTarget: null
    }
  };

  return new Map(
    Object.entries(defaults).map(([key, value]) => [
      key,
      { ...value, ...overrides[key] }
    ])
  );
}

describe("deriveWarbandMythicPlusGoal", () => {
  it("is COMPLETE when any Character meets the Warband target", () => {
    const goal = deriveWarbandMythicPlusGoal([1847, 2631, null], 2000);

    expect(goal.state).toBe("COMPLETE");
    expect(goal.label).toBe("2631 ✓");
    expect(goal.key).toBe("warband-mythic-plus-score");
  });

  it("is UNKNOWN when nobody is known-complete and a Character is unresolved", () => {
    const goal = deriveWarbandMythicPlusGoal([1847, null], 2000);

    expect(goal.state).toBe("UNKNOWN");
    expect(goal.label).toBe("1847 → 2K");
    expect(goal.actionLabel).toBeNull();
  });

  it("is INCOMPLETE only when every Character is known below the target", () => {
    const goal = deriveWarbandMythicPlusGoal([1847, 1900], 2000);

    expect(goal.state).toBe("INCOMPLETE");
    expect(goal.label).toBe("1900 → 2K");
  });
});

describe("deriveWarbandResilientKeystoneGoal", () => {
  it("uses the best known floor, COMPLETE if any Character meets the target", () => {
    const goal = deriveWarbandResilientKeystoneGoal(
      [
        progress([12, 12, 12, 12, 12, 12, 12, 12]),
        progress([14, 15, 14, 17, 16, 14, 15, 16]),
        null
      ],
      14
    );

    expect(goal.state).toBe("COMPLETE");
    expect(goal.label).toBe("14");
    expect(goal.key).toBe("warband-resilient-keystone");
  });

  it("stays UNKNOWN when the best known floor is below target and someone is unresolved", () => {
    const goal = deriveWarbandResilientKeystoneGoal(
      [progress([12, 12, 12, 12, 12, 12, 12, 12]), null],
      14
    );

    expect(goal.state).toBe("UNKNOWN");
    expect(goal.label).toBe("12");
  });
});

describe("buildWarbandNumericGoals", () => {
  it("always includes Score when enabled and hides Resi until the user opts in", () => {
    const goals = buildWarbandNumericGoals([2100], [null], warbandPrefs());

    expect(goals.map((goal) => goal.key)).toEqual(["warband-mythic-plus-score"]);
  });

  it("includes Resi only when enabled with a target", () => {
    const goals = buildWarbandNumericGoals(
      [2100],
      [progress([12, 12, 12, 12, 12, 12, 12, 12])],
      warbandPrefs({
        "warband-resilient-keystone": {
          enabled: true,
          numericTarget: 12
        }
      })
    );

    expect(goals.map((goal) => goal.key)).toEqual([
      "warband-mythic-plus-score",
      "warband-resilient-keystone"
    ]);
  });
});
