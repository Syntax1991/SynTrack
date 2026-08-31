import { describe, expect, it } from "vitest";
import { resolveWeeklySummaryOverviewState } from "./overview-weekly-summary.mapper.js";
import type { ProfessionWeeklyOverviewState } from "./overview.types.js";

const zeroAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

function professionWeekly(
  overrides: Partial<ProfessionWeeklyOverviewState> = {}
): ProfessionWeeklyOverviewState {
  return {
    state: "ATTENTION",
    quest: zeroAggregate,
    treatise: zeroAggregate,
    drops: zeroAggregate,
    professions: [],
    ...overrides
  };
}

describe("resolveWeeklySummaryOverviewState triage states", () => {
  it("maps unresolved-only gameplay to UNKNOWN without known incomplete", () => {
    const { weeklySummary } = resolveWeeklySummaryOverviewState({
      characterId: "char-u",
      characterName: "Synlight",
      trackingProfile: "FULL",
      vault: {
        state: "UNKNOWN",
        unlockedSlots: 0,
        slotsTotal: 0,
        highestKeyLevel: null,
        source: "ADDON"
      },
      mythicPlusState: "UNKNOWN",
      raidState: "UNKNOWN",
      delvesState: "UNKNOWN",
      professionWeekly: professionWeekly({
        state: "READY",
        quest: zeroAggregate,
        treatise: zeroAggregate,
        drops: zeroAggregate
      })
    });

    expect(weeklySummary.state).toBe("UNKNOWN");
    expect(weeklySummary.unknownCount).toBeGreaterThan(0);
  });

  it("maps all known complete recurring work to READY", () => {
    const { weeklySummary } = resolveWeeklySummaryOverviewState({
      characterId: "char-r",
      characterName: "Synblast",
      trackingProfile: "FULL",
      vault: {
        state: "READY",
        unlockedSlots: 9,
        slotsTotal: 9,
        highestKeyLevel: null,
        source: "ADDON"
      },
      mythicPlusState: "READY",
      raidState: "READY",
      delvesState: "READY",
      professionWeekly: professionWeekly({
        state: "READY",
        quest: {
          completeCount: 1,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 1
        },
        treatise: {
          completeCount: 1,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 1
        },
        drops: {
          completeCount: 2,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 2
        }
      })
    });

    expect(weeklySummary.state).toBe("READY");
    expect(weeklySummary.unknownCount).toBe(0);
  });
});
