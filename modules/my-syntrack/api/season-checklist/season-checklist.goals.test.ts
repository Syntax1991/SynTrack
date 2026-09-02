import { describe, expect, it } from "vitest";
import {
  deriveSeasonMythicPlusGoal,
  summarizeSeasonGoals
} from "./season-checklist.goals.js";
import {
  blockedCharacterSeasonGoalGaps,
  enabledCharacterSeasonGoals,
  enabledWarbandSeasonGoals,
  MIDNIGHT_S2_SEASON_GOAL_CATALOG,
  warbandSeasonGoalGaps
} from "./season-goal-catalog.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";

function definition(): TrackerDefinitionRow {
  return {
    id: "rating-def",
    scopeKey: "MIDNIGHT-S2",
    key: "mythic-plus-rating",
    name: "Mythic+ Rating (2,000)",
    valueType: "NUMBER",
    resetBehavior: "SEASONAL",
    category: "GAMEPLAY",
    sortOrder: 10,
    isPinned: false,
    enabled: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z")
  };
}

function numberState(number: number): CharacterTrackerState {
  return {
    trackerDefinitionId: "rating-def",
    characterId: "char-1",
    periodKey: "ALWAYS",
    state: "RECORDED",
    source: "ADDON",
    value: {
      valueType: "NUMBER",
      number
    }
  };
}

describe("season checklist goals", () => {
  it("shows condensed complete M+ milestone", () => {
    const goal = deriveSeasonMythicPlusGoal({
      definition: definition(),
      state: numberState(2050)
    });

    expect(goal.state).toBe("COMPLETE");
    expect(goal.label).toBe("✓ 2K");
  });

  it("shows condensed score toward default 2K milestone", () => {
    const goal = deriveSeasonMythicPlusGoal({
      definition: definition(),
      state: numberState(1847)
    });

    expect(goal.state).toBe("INCOMPLETE");
    expect(goal.label).toBe("1847 → 2K");
    expect(goal.actionLabel).toBe("Reach 2K Mythic+ rating");
  });

  it("keeps unknown when rating evidence is missing", () => {
    const goal = deriveSeasonMythicPlusGoal({
      definition: definition(),
      state: null
    });

    expect(goal.state).toBe("UNKNOWN");
    expect(goal.label).toBe("?");
  });

  it("summarizes open/complete/unknown without a mixed percentage", () => {
    const summary = summarizeSeasonGoals([
      {
        key: "rating-2000",
        title: "M+",
        state: "COMPLETE",
        label: "✓ 2K",
        detail: "ok",
        actionLabel: null
      },
      {
        key: "other",
        title: "Other",
        state: "INCOMPLETE",
        label: "open",
        detail: "open",
        actionLabel: "Do other"
      },
      {
        key: "unknown",
        title: "Unknown",
        state: "UNKNOWN",
        label: "?",
        detail: "?",
        actionLabel: null
      }
    ]);

    expect(summary).toEqual({
      goalsOpen: 1,
      goalsComplete: 1,
      goalsUnknown: 1,
      action: "Do other"
    });
  });
});

describe("season goal catalog", () => {
  it("enables only evidence-backed character goals in V1", () => {
    expect(enabledCharacterSeasonGoals().map((goal) => goal.key)).toEqual([
      "rating-2000"
    ]);
  });

  it("keeps disabled goals internal and never as live warband product rows", () => {
    const warband = warbandSeasonGoalGaps();

    expect(warband.map((goal) => goal.key)).toEqual([
      "tier-visual",
      "delvers-journey",
      "valeera-80"
    ]);
    expect(warband.every((goal) => goal.enabled === false)).toBe(true);
    expect(enabledWarbandSeasonGoals()).toEqual([]);
  });

  it("treats portals checklist goal as seasonal, not permanent source fact", () => {
    const portals = MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
      (goal) => goal.key === "portals"
    );

    expect(portals?.resetBehavior).toBe("SEASONAL");
    expect(portals?.enabled).toBe(false);
  });

  it("marks Valeera lifecycle unresolved until companion capture exists", () => {
    const valeera = MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
      (goal) => goal.key === "valeera-80"
    );

    expect(valeera?.resetBehavior).toBe("UNRESOLVED");
    expect(valeera?.enabled).toBe(false);
  });

  it("keeps capture-gap character goals disabled and out of enabled set", () => {
    const blocked = blockedCharacterSeasonGoalGaps();

    expect(blocked.some((goal) => goal.key === "cracked-keystone")).toBe(
      true
    );
    expect(
      enabledCharacterSeasonGoals().some(
        (goal) => goal.key === "cracked-keystone"
      )
    ).toBe(false);
  });
});
