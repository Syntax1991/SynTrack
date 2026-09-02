import { describe, expect, it } from "vitest";
import {
  deriveSeasonTwoKGoal,
  summarizeSeasonGoals
} from "./season-checklist.goals.js";
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
  it("marks 2K complete at or above 2000", () => {
    const goal = deriveSeasonTwoKGoal({
      definition: definition(),
      state: numberState(2050)
    });

    expect(goal.state).toBe("COMPLETE");
    expect(goal.label).toBe("✓");
  });

  it("shows compact rating below 2000", () => {
    const goal = deriveSeasonTwoKGoal({
      definition: definition(),
      state: numberState(1847)
    });

    expect(goal.state).toBe("INCOMPLETE");
    expect(goal.label).toBe("1847");
    expect(goal.actionLabel).toBe("Reach 2K Mythic+ rating");
  });

  it("keeps unknown when rating evidence is missing", () => {
    const goal = deriveSeasonTwoKGoal({
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
        title: "2K",
        state: "COMPLETE",
        label: "✓",
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
