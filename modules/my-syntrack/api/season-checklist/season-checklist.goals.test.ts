import { describe, expect, it } from "vitest";
import {
  applyGoalEnabledGate,
  deriveSeasonMythicPlusGoal,
  seasonActionDisplay,
  seasonStatusLabel,
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
  it("shows the real score after reaching the 2K milestone", () => {
    const goal = deriveSeasonMythicPlusGoal({
      definition: definition(),
      state: numberState(2050)
    });

    expect(goal.state).toBe("COMPLETE");
    expect(goal.label).toBe("2050 ✓");
  });

  it("shows the real score for a high score well past the milestone", () => {
    const goal = deriveSeasonMythicPlusGoal({
      definition: definition(),
      state: numberState(2678)
    });

    expect(goal.state).toBe("COMPLETE");
    expect(goal.label).toBe("2678 ✓");
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

  it("shows 1951 -> 2K for a score just below the milestone", () => {
    const goal = deriveSeasonMythicPlusGoal({
      definition: definition(),
      state: numberState(1951)
    });

    expect(goal.state).toBe("INCOMPLETE");
    expect(goal.label).toBe("1951 → 2K");
  });

  it("uses a configurable target instead of the hardcoded 2K milestone", () => {
    const incomplete2631 = deriveSeasonMythicPlusGoal(
      { definition: definition(), state: numberState(2631) },
      3000
    );
    expect(incomplete2631.state).toBe("INCOMPLETE");
    expect(incomplete2631.label).toBe("2631 → 3K");
    expect(incomplete2631.actionLabel).toBe("Reach 3K Mythic+ rating");

    const complete2631 = deriveSeasonMythicPlusGoal(
      { definition: definition(), state: numberState(2631) },
      2000
    );
    expect(complete2631.state).toBe("COMPLETE");
    expect(complete2631.label).toBe("2631 ✓");

    const target2500 = deriveSeasonMythicPlusGoal(
      { definition: definition(), state: numberState(2399) },
      2500
    );
    expect(target2500.label).toBe("2399 → 2.5K");
  });

  it("never creates a second tracker fact when only the target changes — same score, different label", () => {
    const state = numberState(2631);
    const target2000 = deriveSeasonMythicPlusGoal(
      { definition: definition(), state },
      2000
    );
    const target3000 = deriveSeasonMythicPlusGoal(
      { definition: definition(), state },
      3000
    );

    expect(target2000.state).toBe("COMPLETE");
    expect(target3000.state).toBe("INCOMPLETE");
    // Same canonical score fact underneath both derivations.
    expect(target2000.label).toContain("2631");
    expect(target3000.label).toContain("2631");
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

  it("STATUS and ACTION never show false completion for unknown-only rows", () => {
    expect(
      seasonStatusLabel({
        goalsOpen: 0,
        goalsComplete: 1,
        goalsUnknown: 5
      })
    ).toBe("5 unknown");

    expect(
      seasonStatusLabel({
        goalsOpen: 1,
        goalsComplete: 2,
        goalsUnknown: 2
      })
    ).toBe("1 open");

    expect(
      seasonStatusLabel({
        goalsOpen: 0,
        goalsComplete: 6,
        goalsUnknown: 0
      })
    ).toBe("✓");

    expect(
      seasonActionDisplay({
        action: null,
        goalsOpen: 0,
        goalsComplete: 1,
        goalsUnknown: 5
      })
    ).toEqual({ kind: "unknown", label: "?" });

    expect(
      seasonActionDisplay({
        action: "Complete Cracked Keystone",
        goalsOpen: 1,
        goalsComplete: 3,
        goalsUnknown: 1
      })
    ).toEqual({ kind: "action", label: "Complete Cracked Keystone" });

    expect(
      seasonActionDisplay({
        action: null,
        goalsOpen: 0,
        goalsComplete: 6,
        goalsUnknown: 0
      })
    ).toEqual({ kind: "complete", label: "✓" });
  });
});

describe("applyGoalEnabledGate", () => {
  it("passes an enabled goal through unchanged", () => {
    const signal = {
      key: "nemesis",
      title: "Nemesis",
      state: "INCOMPLETE" as const,
      label: "✕",
      detail: "detail",
      actionLabel: "Defeat Azta'rec"
    };

    expect(applyGoalEnabledGate(signal, true)).toEqual(signal);
  });

  it("overrides a disabled goal to NOT_APPLICABLE with a dash, never COMPLETE", () => {
    const gated = applyGoalEnabledGate(
      {
        key: "nemesis",
        title: "Nemesis",
        state: "INCOMPLETE",
        label: "✕",
        detail: "detail",
        actionLabel: "Defeat Azta'rec"
      },
      false
    );

    expect(gated.state).toBe("NOT_APPLICABLE");
    expect(gated.label).toBe("—");
    expect(gated.actionLabel).toBeNull();

    // NOT_APPLICABLE is excluded from summarizeSeasonGoals entirely.
    const summary = summarizeSeasonGoals([gated]);
    expect(summary).toEqual({
      goalsOpen: 0,
      goalsComplete: 0,
      goalsUnknown: 0,
      action: null
    });
  });
});
