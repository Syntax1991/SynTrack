import { describe, expect, it } from "vitest";
import { createDefaultWeekliesGameplaySignals } from "../../../api/weekly-checklist/weeklies-gameplay-signals.mapper.js";
import type { WeeklyChecklistCharacter } from "../types/weeklyChecklist.types";
import type { WeeklyGameplayDomainView } from "../../../api/weekly-gameplay/weekly-gameplay.types.js";
import {
  gameplaySignalToken,
  professionSummaryToken,
  weeklyActionLabel
} from "./weeklyChecklistCells";

function gameplayDomain(
  overrides: Partial<WeeklyGameplayDomainView> & Pick<WeeklyGameplayDomainView, "label">
): WeeklyGameplayDomainView {
  return {
    state: "UNKNOWN",
    completeCount: 0,
    applicableTotal: 0,
    unknownCount: 1,
    rawCompleteCount: 0,
    knownUnlockedSlots: 0,
    maxSlots: 0,
    hasUnknownCategories: false,
    unknownCategoryCount: 0,
    ...overrides
  };
}

function buildCharacter(
  overrides: Partial<WeeklyChecklistCharacter> = {}
): WeeklyChecklistCharacter {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80,
    trackingProfile: "FULL",
    weeklyGameplay: null,
    completedTaskKeys: [],
    professionWeeklySummary: {
      state: "NOT_APPLICABLE",
      label: "—",
      openProfessionCount: 0,
      unknownProfessionCount: 0,
      path: "/professions"
    },
    gameplaySignals: createDefaultWeekliesGameplaySignals(),
    ...overrides
  };
}

function readyGameplay() {
  return {
    characterId: "char-1",
    vault: gameplayDomain({
      label: "Vault",
      state: "READY",
      completeCount: 9,
      applicableTotal: 9,
      knownUnlockedSlots: 9,
      maxSlots: 9
    }),
    mythicPlus: gameplayDomain({
      label: "M+",
      state: "READY",
      completeCount: 8,
      applicableTotal: 8
    }),
    raid: gameplayDomain({
      label: "Raid",
      state: "READY",
      completeCount: 8,
      applicableTotal: 8
    }),
    delves: gameplayDomain({
      label: "Delves",
      state: "READY",
      completeCount: 8,
      applicableTotal: 8
    }),
    mythicPlusAction: null,
    raidAction: null,
    delvesAction: null,
    highestKeyLevel: null
  };
}

describe("weeklyChecklistCells boundary", () => {
  it("keeps gameplay action complete when profession work remains open", () => {
    const action = weeklyActionLabel(
      buildCharacter({
        weeklyGameplay: readyGameplay(),
        professionWeeklySummary: {
          state: "ATTENTION",
          label: "2 open",
          openProfessionCount: 2,
          unknownProfessionCount: 0,
          path: "/professions"
        }
      })
    );

    expect(action).toBeNull();
  });

  it("may surface weekly meta quest action after core gameplay actions", () => {
    const action = weeklyActionLabel(
      buildCharacter({
        weeklyGameplay: readyGameplay(),
        gameplaySignals: {
          ...createDefaultWeekliesGameplaySignals(),
          meta: {
            state: "INCOMPLETE",
            label: "open",
            title: "Weekly Meta Quest",
            actionLabel: "Complete Meta Quest"
          }
        }
      })
    );

    expect(action).toBe("Complete Meta Quest");
  });

  it("does not surface 2K RIO as gameplay action", () => {
    const action = weeklyActionLabel(
      buildCharacter({
        weeklyGameplay: readyGameplay()
      })
    );

    expect(action).toBeNull();
  });

  it("keeps gameplay action independent from profession weekly work", () => {
    const action = weeklyActionLabel(
      buildCharacter({
        weeklyGameplay: {
          ...readyGameplay(),
          mythicPlusAction: "Run 4 M+ for next Vault slot"
        },
        professionWeeklySummary: {
          state: "ATTENTION",
          label: "1 open",
          openProfessionCount: 1,
          unknownProfessionCount: 0,
          path: "/professions"
        }
      })
    );

    expect(action).toBe("Run 4 M+ for next Vault slot");
    expect(action).not.toMatch(/Treatise|Quest|Drop|Knowledge/i);
  });

  it("renders compact gameplay signal tokens", () => {
    expect(
      gameplaySignalToken({
        state: "COMPLETE",
        label: "✓",
        title: "2K RIO",
        actionLabel: null
      }).symbol
    ).toBe("✓");

    expect(
      gameplaySignalToken({
        state: "UNKNOWN",
        label: "?",
        title: "2K RIO",
        actionLabel: null
      }).symbol
    ).toBe("?");
  });

  it("renders compact profession summary states", () => {
    expect(
      professionSummaryToken(
        buildCharacter({
          professionWeeklySummary: {
            state: "ATTENTION",
            label: "2 open",
            openProfessionCount: 2,
            unknownProfessionCount: 0,
            path: "/professions"
          }
        })
      ).symbol
    ).toBe("2 open");

    expect(
      professionSummaryToken(
        buildCharacter({
          professionWeeklySummary: {
            state: "COMPLETE",
            label: "✓",
            openProfessionCount: 0,
            unknownProfessionCount: 0,
            path: "/professions"
          }
        })
      ).symbol
    ).toBe("✓");

    expect(
      professionSummaryToken(
        buildCharacter({
          professionWeeklySummary: {
            state: "UNKNOWN",
            label: "?",
            openProfessionCount: 0,
            unknownProfessionCount: 1,
            path: "/professions"
          }
        })
      ).symbol
    ).toBe("?");
  });
});
