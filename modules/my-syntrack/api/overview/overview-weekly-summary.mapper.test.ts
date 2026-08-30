import { describe, expect, it } from "vitest";
import { formatKnownWeeklyProgressSymbol } from "../weekly-progress/weekly-progress-display.js";
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

function weeklySymbol(
  summary: ReturnType<
    typeof resolveWeeklySummaryOverviewState
  >["weeklySummary"]
): string {
  return formatKnownWeeklyProgressSymbol({
    completedKnown: summary.completedKnown,
    applicableKnown: summary.applicableKnown,
    unknownCount: summary.unknownCount
  });
}

describe("resolveWeeklySummaryOverviewState", () => {
  describe("known profession progress (gameplay-enabled)", () => {
    it("CASE A — two crafting professions: Quest 2/2, Treatise 2/2, Drops 0/4 => 4/8 · 4?", () => {
      const { weeklySummary } = resolveWeeklySummaryOverviewState({
        characterId: "char-a",
        characterName: "Synblast",
        trackingProfile: "FULL",
        vault: {
          state: "UNKNOWN",
          unlockedSlots: 0,
          slotsTotal: 0,
          highestKeyLevel: null,
          source: "MANUAL_LOG"
        },
        professionWeekly: professionWeekly({
          quest: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          treatise: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          drops: {
            completeCount: 0,
            incompleteCount: 4,
            unknownCount: 0,
            applicableTotal: 4
          }
        })
      });

      expect(weeklySummary.completedKnown).toBe(4);
      expect(weeklySummary.applicableKnown).toBe(8);
      expect(weeklySummary.unknownCount).toBe(4);
      expect(weeklySymbol(weeklySummary)).toBe("4/8 · 4?");
    });

    it("CASE B — Enchanting + crafting: Drops 0/6 => 4/10 · 4?", () => {
      const { weeklySummary } = resolveWeeklySummaryOverviewState({
        characterId: "char-b",
        characterName: "Synmist",
        trackingProfile: "FULL",
        vault: {
          state: "UNKNOWN",
          unlockedSlots: 0,
          slotsTotal: 0,
          highestKeyLevel: null,
          source: "MANUAL_LOG"
        },
        professionWeekly: professionWeekly({
          quest: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          treatise: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          drops: {
            completeCount: 0,
            incompleteCount: 6,
            unknownCount: 0,
            applicableTotal: 6
          }
        })
      });

      expect(weeklySummary.completedKnown).toBe(4);
      expect(weeklySummary.applicableKnown).toBe(10);
      expect(weeklySummary.unknownCount).toBe(4);
      expect(weeklySymbol(weeklySummary)).toBe("4/10 · 4?");
    });

    it("CASE C — one Drop complete: 5/10 · 4?", () => {
      const { weeklySummary } = resolveWeeklySummaryOverviewState({
        characterId: "char-c",
        characterName: "Syndraco",
        trackingProfile: "FULL",
        vault: {
          state: "UNKNOWN",
          unlockedSlots: 0,
          slotsTotal: 0,
          highestKeyLevel: null,
          source: "MANUAL_LOG"
        },
        professionWeekly: professionWeekly({
          quest: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          treatise: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          drops: {
            completeCount: 1,
            incompleteCount: 5,
            unknownCount: 0,
            applicableTotal: 6
          }
        })
      });

      expect(weeklySummary.completedKnown).toBe(5);
      expect(weeklySummary.applicableKnown).toBe(10);
      expect(weeklySummary.unknownCount).toBe(4);
      expect(weeklySymbol(weeklySummary)).toBe("5/10 · 4?");
    });
  });

  describe("profession-only characters", () => {
    it("disables gameplay domains and shows 4/8 without unknown suffix", () => {
      const { weeklySummary } = resolveWeeklySummaryOverviewState({
        characterId: "char-p",
        characterName: "Synsin",
        trackingProfile: "PROFESSION",
        vault: {
          state: "READY",
          unlockedSlots: 3,
          slotsTotal: 3,
          highestKeyLevel: null,
          source: "MANUAL_LOG"
        },
        professionWeekly: professionWeekly({
          quest: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          treatise: {
            completeCount: 2,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 2
          },
          drops: {
            completeCount: 0,
            incompleteCount: 4,
            unknownCount: 0,
            applicableTotal: 4
          }
        })
      });

      const gameplayDomains = weeklySummary.domains.filter((domain) =>
        ["vault", "mythic-plus", "raid", "delves"].includes(domain.key)
      );

      expect(gameplayDomains.every((domain) => domain.state === "NOT_TRACKED")).toBe(
        true
      );
      expect(weeklySummary.completedKnown).toBe(4);
      expect(weeklySummary.applicableKnown).toBe(8);
      expect(weeklySummary.unknownCount).toBe(0);
      expect(weeklySymbol(weeklySummary)).toBe("4/8");
    });
  });

  it("never folds UNKNOWN gameplay into the numeric denominator", () => {
    const { weeklySummary } = resolveWeeklySummaryOverviewState({
      characterId: "char-d",
      characterName: "Synlight",
      trackingProfile: "FULL",
      vault: {
        state: "UNKNOWN",
        unlockedSlots: 0,
        slotsTotal: 0,
        highestKeyLevel: null,
        source: "MANUAL_LOG"
      },
      professionWeekly: professionWeekly({
        quest: {
          completeCount: 2,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 2
        },
        treatise: {
          completeCount: 2,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 2
        },
        drops: {
          completeCount: 0,
          incompleteCount: 6,
          unknownCount: 0,
          applicableTotal: 6
        }
      })
    });

    expect(weeklySummary.applicableKnown).not.toBe(14);
    expect(weeklySummary.applicableKnown).toBe(10);
  });
});
