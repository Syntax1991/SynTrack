import { describe, expect, it } from "vitest";
import { summarizeSeasonGoals, seasonActionDisplay } from "./season-checklist.goals.js";
import {
  blockedCharacterSeasonGoalGaps,
  enabledCharacterSeasonGoals,
  enabledWarbandSeasonGoals,
  MIDNIGHT_S2_SEASON_GOAL_CATALOG,
  warbandSeasonGoalGaps
} from "./season-goal-catalog.js";
import { SEASON_EVIDENCE_CATALOG } from "./season-evidence-catalog.js";

describe("season goal catalog", () => {
  it("contains only the verified achievement and quest IDs", () => {
    // Portal achievement IDs appear twice: once for the legacy CHARACTER
    // tracker (untouched, ignored by Warband) and once for the new
    // WARBAND-scoped tracker derived from the same raw addon evidence.
    expect(
      SEASON_EVIDENCE_CATALOG.map((entry) => entry.externalId).sort(
        (left, right) => left - right
      )
    ).toEqual([
      62437, 62437, 62438, 62438, 62439, 62439, 62440, 62440,
      62441, 62441, 62442, 62442, 62443, 62443, 62444, 62444,
      62872, 63326, 63333, 63435, 63473, 63650, 63651, 97910
    ]);
    expect(SEASON_EVIDENCE_CATALOG.every((entry) => entry.verified)).toBe(
      true
    );
  });

  it("enables all verified evidence-backed character goals", () => {
    // Portals moved to Warband scope — no longer a Character goal.
    expect(enabledCharacterSeasonGoals().map((goal) => goal.key)).toEqual([
      "rating-2000",
      "tier-4pc",
      "embellishments",
      "cracked-keystone",
      "nemesis-aztarec",
      "aotc-ulatek",
      "ce-ulatek"
    ]);
  });

  it("disables Serpent Scion as a primary checklist goal while retaining evidence", () => {
    expect(
      MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
        (goal) => goal.key === "serpent-scion"
      )
    ).toMatchObject({
      enabled: false,
      captureGap:
        "Serpent Scion duplicates M+/Raid progression and is not a primary checklist goal"
    });
    expect(
      blockedCharacterSeasonGoalGaps().some(
        (goal) => goal.key === "serpent-scion"
      )
    ).toBe(true);
    expect(SEASON_EVIDENCE_CATALOG.some((entry) => entry.externalId === 62872)).toBe(
      true
    );
  });

  it("does not count Serpent Scion toward Status or Action when omitted from live goals", () => {
    const summary = summarizeSeasonGoals([
      {
        key: "rating-2000",
        title: "M+",
        state: "COMPLETE",
        label: "✓ 2K",
        detail: "done",
        actionLabel: null
      },
      {
        key: "tier-4pc",
        title: "Tier",
        state: "COMPLETE",
        label: "✓ 4/4",
        detail: "done",
        actionLabel: null
      },
      {
        key: "embellishments",
        title: "Emb",
        state: "COMPLETE",
        label: "✓ 2/2",
        detail: "done",
        actionLabel: null
      },
      {
        key: "cracked-keystone",
        title: "Cracked",
        state: "COMPLETE",
        label: "✓",
        detail: "done",
        actionLabel: null
      },
      {
        key: "nemesis-aztarec",
        title: "Nemesis",
        state: "UNKNOWN",
        label: "?",
        detail: "?",
        actionLabel: null
      },
      {
        key: "raid",
        title: "Raid",
        state: "COMPLETE",
        label: "✓ AOTC",
        detail: "done",
        actionLabel: null
      }
    ]);

    expect(summary).toEqual({
      goalsOpen: 0,
      goalsComplete: 5,
      goalsUnknown: 1,
      action: null
    });
    expect(seasonActionDisplay(summary).label).toBe("?");
    expect(summary.action).not.toBe("Earn Serpent Scion");
  });

  it("keeps tier-visual and Delver's Journey internal while Portals/Valeera are live warband goals", () => {
    const warband = warbandSeasonGoalGaps();

    expect(warband.map((goal) => goal.key)).toEqual([
      "portals",
      "tier-visual",
      "delvers-journey",
      "valeera-80"
    ]);
    expect(enabledWarbandSeasonGoals().map((goal) => goal.key)).toEqual([
      "portals",
      "valeera-80"
    ]);
    expect(
      MIDNIGHT_S2_SEASON_GOAL_CATALOG.find((goal) => goal.key === "tier-visual")
    ).toMatchObject({
      enabled: false,
      captureGap:
        "Cosmetic tier visual unlock is not part of the primary Season checklist"
    });
    expect(
      MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
        (goal) => goal.key === "delvers-journey"
      )?.enabled
    ).toBe(false);
  });

  it("treats portals checklist goal as seasonal, not permanent source fact", () => {
    const portals = MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
      (goal) => goal.key === "portals"
    );

    expect(portals?.resetBehavior).toBe("SEASONAL");
    expect(portals?.enabled).toBe(true);
  });

  it("resolves Valeera lifecycle now that completion evidence exists", () => {
    const valeera = MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
      (goal) => goal.key === "valeera-80"
    );

    expect(valeera?.resetBehavior).toBe("SEASONAL");
    expect(valeera?.enabled).toBe(true);
    expect(valeera?.captureGap).toBeNull();
  });

  it("keeps Delver's Journey disabled", () => {
    expect(
      MIDNIGHT_S2_SEASON_GOAL_CATALOG.find(
        (goal) => goal.key === "delvers-journey"
      )?.enabled
    ).toBe(false);
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
