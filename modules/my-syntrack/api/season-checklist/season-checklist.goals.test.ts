import { describe, expect, it } from "vitest";
import {
  deriveSeasonMythicPlusGoal,
  seasonActionDisplay,
  seasonStatusLabel,
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
import { SEASON_EVIDENCE_CATALOG } from "./season-evidence-catalog.js";

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

describe("season goal catalog", () => {
  it("contains only the verified achievement and quest IDs", () => {
    expect(
      SEASON_EVIDENCE_CATALOG.map((entry) => entry.externalId).sort(
        (left, right) => left - right
      )
    ).toEqual([
      62437, 62438, 62439, 62440, 62441, 62442, 62443, 62444,
      62872, 63326, 63333, 63473, 63650, 63651, 97910
    ]);
    expect(SEASON_EVIDENCE_CATALOG.every((entry) => entry.verified)).toBe(
      true
    );
  });

  it("enables all verified evidence-backed character goals", () => {
    expect(enabledCharacterSeasonGoals().map((goal) => goal.key)).toEqual([
      "rating-2000",
      "tier-4pc",
      "embellishments",
      "portals",
      "serpent-scion",
      "cracked-keystone",
      "nemesis-aztarec",
      "aotc-ulatek",
      "ce-ulatek"
    ]);
  });

  it("keeps disabled goals internal and never as live warband product rows", () => {
    const warband = warbandSeasonGoalGaps();

    expect(warband.map((goal) => goal.key)).toEqual([
      "tier-visual",
      "delvers-journey",
      "valeera-80"
    ]);
    expect(enabledWarbandSeasonGoals()).toEqual([]);
    expect(
      MIDNIGHT_S2_SEASON_GOAL_CATALOG.find((goal) => goal.key === "tier-visual")
    ).toMatchObject({
      enabled: false,
      captureGap:
        "Cosmetic tier visual unlock is not part of the primary Season checklist"
    });
  });

  it("treats portals checklist goal as seasonal, not permanent source fact", () => {
    const portals = MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
      (goal) => goal.key === "portals"
    );

    expect(portals?.resetBehavior).toBe("SEASONAL");
    expect(portals?.enabled).toBe(true);
  });

  it("marks Valeera lifecycle unresolved until companion capture exists", () => {
    const valeera = MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
      (goal) => goal.key === "valeera-80"
    );

    expect(valeera?.resetBehavior).toBe("UNRESOLVED");
    expect(valeera?.enabled).toBe(false);
  });

  it("keeps Delver's Journey and Valeera disabled", () => {
    expect(
      MIDNIGHT_S2_SEASON_GOAL_CATALOG.filter((goal) =>
        ["delvers-journey", "valeera-80"].includes(goal.key)
      ).every((goal) => !goal.enabled)
    ).toBe(true);
  });

  it("keeps solo stretch goal disabled and enables cracked keystone", () => {
    const blocked = blockedCharacterSeasonGoalGaps();

    expect(blocked.some((goal) => goal.key === "nemesis-aztarec-solo")).toBe(
      true
    );
    expect(
      enabledCharacterSeasonGoals().some(
        (goal) => goal.key === "cracked-keystone"
      )
    ).toBe(true);
  });
});
