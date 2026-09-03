import { describe, expect, it } from "vitest";
import type { MythicPlusSeasonProgress } from "../weekly-gameplay/mythic-plus-season-progress.service.js";
import { deriveResilientKeystoneGoal } from "./season-checklist.resilient.js";

function progress(
  levels: number[],
  captured = true
): MythicPlusSeasonProgress {
  return {
    captured,
    dungeonBests: levels.map((bestKeyLevel, index) => ({
      mapChallengeModeId: 500 + index,
      bestKeyLevel
    }))
  };
}

describe("deriveResilientKeystoneGoal", () => {
  it("derives floor 12 when every dungeon is timed at least 12", () => {
    const goal = deriveResilientKeystoneGoal(
      progress([12, 12, 13, 14, 12, 15, 12, 13])
    );

    expect(goal.state).toBe("COMPLETE");
    expect(goal.label).toBe("12");
  });

  it("derives floor 14 when the minimum across all 8 is 14", () => {
    const goal = deriveResilientKeystoneGoal(
      progress([14, 15, 14, 17, 16, 14, 15, 16])
    );

    expect(goal.label).toBe("14");
  });

  it("shows N/8 -> 12 progress when no floor is unlocked yet", () => {
    const goal = deriveResilientKeystoneGoal(
      progress([12, 12, 12, 12, 12, 8, 8, 8])
    );

    expect(goal.state).toBe("INCOMPLETE");
    expect(goal.label).toBe("5/8 → 12");
  });

  it("treats an untimed dungeon as below 12, never as unknown", () => {
    // Only 6 of 8 dungeons have ever been timed this season.
    const goal = deriveResilientKeystoneGoal(progress([12, 12, 12, 12, 12, 12]));

    expect(goal.state).toBe("INCOMPLETE");
    expect(goal.label).toBe("6/8 → 12");
  });

  it("returns unknown when capture completeness cannot be proven", () => {
    expect(deriveResilientKeystoneGoal(progress([], false)).label).toBe("?");
    expect(deriveResilientKeystoneGoal(null).label).toBe("?");
  });

  it("never derives a floor from stale/old-season rows beyond the season's dungeon count", () => {
    const goal = deriveResilientKeystoneGoal(
      progress([12, 12, 12, 12, 12, 12, 12, 12, 12])
    );

    expect(goal.state).toBe("UNKNOWN");
    expect(goal.label).toBe("?");
  });

  it("does not contribute to STATUS or ACTION (informational only)", () => {
    const goal = deriveResilientKeystoneGoal(progress([12, 12, 12, 12, 12, 12, 12, 12]));

    // This goal is simply never passed into summarizeSeasonGoals by the
    // service — asserting its state alone here to document the contract;
    // the exclusion itself is proven by season-checklist.service not
    // referencing "resilient-keystone" in its summarizeSeasonGoals call.
    expect(goal.key).toBe("resilient-keystone");
    expect(goal.actionLabel).toBeNull();
  });
});
