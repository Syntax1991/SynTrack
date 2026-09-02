import { describe, expect, it } from "vitest";
import type { WeekliesGameplaySignals } from "../weekly-checklist/weeklies-gameplay-signals.types.js";
import type { WeeklyGameplayCharacterView } from "../weekly-gameplay/weekly-gameplay.types.js";
import {
  buildOverviewDecisionResponse,
  compareOverviewActionCandidates,
  overviewHorizonLabel,
  sortOverviewActionCandidates
} from "./overview-decision.compose.js";
import type { OverviewActionCandidate } from "./overview-decision.types.js";
import { deriveWeekliesGameplayAction } from "./overview-decision.weeklies.js";

function candidate(
  overrides: Partial<OverviewActionCandidate> &
    Pick<OverviewActionCandidate, "action" | "horizon" | "source">
): OverviewActionCandidate {
  return {
    characterId: overrides.characterId ?? "c1",
    characterName: overrides.characterName ?? "Synblast",
    className: overrides.className ?? "Shaman",
    path: overrides.path ?? "/season",
    localOrder: overrides.localOrder ?? 0,
    ...overrides
  };
}

function domainView(
  label: string
): WeeklyGameplayCharacterView["vault"] {
  return {
    state: "ATTENTION",
    completeCount: 0,
    applicableTotal: 1,
    unknownCount: 0,
    label,
    rawCompleteCount: 0,
    knownUnlockedSlots: 0,
    maxSlots: 1,
    hasUnknownCategories: false,
    unknownCategoryCount: 0
  };
}

function gameplayView(
  mythicPlusAction: string | null
): WeeklyGameplayCharacterView {
  return {
    characterId: "c1",
    vault: domainView("0/9"),
    mythicPlus: domainView("0/8"),
    raid: domainView("0/6"),
    delves: domainView("0/8"),
    mythicPlusAction,
    raidAction: null,
    delvesAction: null,
    highestKeyLevel: null
  };
}

function signals(): WeekliesGameplaySignals {
  return {
    map: {
      state: "INCOMPLETE",
      label: "open",
      title: "MAP",
      actionLabel: "Complete MAP"
    },
    meta: {
      state: "INCOMPLETE",
      label: "open",
      title: "META",
      actionLabel: "Complete Meta Quest"
    },
    sources: {
      map: {
        configured: true,
        trackerName: "MAP",
        resetBehavior: "WEEKLY"
      },
      meta: {
        configured: true,
        trackerName: "META",
        resetBehavior: "WEEKLY"
      }
    }
  };
}

describe("overview decision compose", () => {
  it("orders WEEKLY before SEASONAL before PERMANENT", () => {
    const actions = sortOverviewActionCandidates([
      candidate({
        action: "Collect Knowledge Treasures",
        horizon: "PERMANENT",
        source: "PROFESSIONS",
        path: "/professions"
      }),
      candidate({
        action: "Complete 4pc tier set",
        horizon: "SEASONAL",
        source: "SEASON"
      }),
      candidate({
        action: "1 M+ run for Vault slot 1",
        horizon: "WEEKLY",
        source: "WEEKLIES",
        path: "/weekly-checklist"
      })
    ]);

    expect(actions.map((row) => row.action)).toEqual([
      "1 M+ run for Vault slot 1",
      "Complete 4pc tier set",
      "Collect Knowledge Treasures"
    ]);
  });

  it("orders gameplay Weeklies before profession weekly in the same horizon", () => {
    const actions = sortOverviewActionCandidates([
      candidate({
        action: "Alchemy: Use Treatise",
        horizon: "WEEKLY",
        source: "PROFESSIONS",
        path: "/professions",
        localOrder: 1,
        characterName: "Synblast"
      }),
      candidate({
        action: "1 M+ run for Vault slot 1",
        horizon: "WEEKLY",
        source: "WEEKLIES",
        path: "/weekly-checklist",
        localOrder: 0,
        characterName: "Synblast"
      })
    ]);

    expect(actions.map((row) => row.source)).toEqual([
      "WEEKLIES",
      "PROFESSIONS"
    ]);
  });

  it("uses stable character name then action tie-breakers", () => {
    const left = candidate({
      characterId: "b",
      characterName: "Synbloom",
      action: "Complete 4pc tier set",
      horizon: "SEASONAL",
      source: "SEASON"
    });
    const right = candidate({
      characterId: "a",
      characterName: "Synblast",
      action: "Complete 4pc tier set",
      horizon: "SEASONAL",
      source: "SEASON"
    });

    expect(compareOverviewActionCandidates(right, left)).toBeLessThan(0);
    expect(
      sortOverviewActionCandidates([left, right]).map(
        (row) => row.characterName
      )
    ).toEqual(["Synblast", "Synbloom"]);
  });

  it("returns identical order for identical repeated calls", () => {
    const input = [
      candidate({
        characterId: "2",
        characterName: "Synvoid",
        action: "Complete Embellishment setup",
        horizon: "SEASONAL",
        source: "SEASON"
      }),
      candidate({
        characterId: "1",
        characterName: "Synmist",
        action: "Complete 4pc tier set",
        horizon: "SEASONAL",
        source: "SEASON"
      }),
      candidate({
        characterId: "3",
        characterName: "Synblast",
        action: "2 more M+ runs for Vault slot 2",
        horizon: "WEEKLY",
        source: "WEEKLIES",
        path: "/weekly-checklist"
      })
    ];

    expect(sortOverviewActionCandidates(input)).toEqual(
      sortOverviewActionCandidates(input)
    );
  });

  it("preserves canonical Season action text", () => {
    const response = buildOverviewDecisionResponse({
      summaries: {
        weekly: { charactersWithWork: 0 },
        season: { open: 1, unknown: 0 },
        professions: { weeklyActions: 0, permanentAttention: 0 },
        unresolved: 0
      },
      actions: [
        candidate({
          action: "Complete 4pc tier set",
          horizon: "SEASONAL",
          source: "SEASON"
        })
      ]
    });

    expect(response.actions[0]?.action).toBe("Complete 4pc tier set");
  });

  it("exposes unresolved empty state without fake complete", () => {
    const response = buildOverviewDecisionResponse({
      summaries: {
        weekly: { charactersWithWork: 0 },
        season: { open: 0, unknown: 2 },
        professions: { weeklyActions: 0, permanentAttention: 0 },
        unresolved: 2
      },
      actions: []
    });

    expect(response.actions).toHaveLength(0);
    expect(response.emptyState).toBe("NO_KNOWN_ACTIONS_UNRESOLVED");
    expect(response.summaries.unresolved).toBe(2);
  });

  it("exposes truthful empty complete state", () => {
    const response = buildOverviewDecisionResponse({
      summaries: {
        weekly: { charactersWithWork: 0 },
        season: { open: 0, unknown: 0 },
        professions: { weeklyActions: 0, permanentAttention: 0 },
        unresolved: 0
      },
      actions: []
    });

    expect(response.emptyState).toBe("NO_OPEN_ACTIONS");
  });

  it("maps horizon labels for UI", () => {
    expect(overviewHorizonLabel("WEEKLY")).toBe("THIS WEEK");
    expect(overviewHorizonLabel("SEASONAL")).toBe("SEASON");
    expect(overviewHorizonLabel("PERMANENT")).toBe("SETUP");
  });
});

describe("deriveWeekliesGameplayAction", () => {
  it("returns null for profession-only profiles", () => {
    expect(
      deriveWeekliesGameplayAction({
        trackingProfile: "PROFESSION",
        weeklyGameplay: gameplayView("1 M+ run for Vault slot 1"),
        gameplaySignals: signals()
      })
    ).toBeNull();
  });

  it("prefers vault/M+ action over MAP/META", () => {
    expect(
      deriveWeekliesGameplayAction({
        trackingProfile: "FULL",
        weeklyGameplay: gameplayView("1 M+ run for Vault slot 1"),
        gameplaySignals: signals()
      })
    ).toBe("1 M+ run for Vault slot 1");
  });
});
