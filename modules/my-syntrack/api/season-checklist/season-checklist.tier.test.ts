import { describe, expect, it } from "vitest";
import { deriveTierOverviewState } from "../gear-readiness/gear-tier-embellishment.deriver.js";
import { ACTIVE_TIER_SET_IDS } from "../gear-readiness/active-tier-sets.js";
import { deriveSeasonTierGoal } from "./season-checklist.tier.js";
import { summarizeSeasonGoals } from "./season-checklist.goals.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

function completeGoal(key: string): SeasonGoalSignal {
  return {
    key,
    title: key,
    state: "COMPLETE",
    label: "✓",
    detail: key,
    actionLabel: null
  };
}

describe("ACTIVE_TIER_SET_IDS Midnight S2 completeness", () => {
  it("includes verified set IDs for all 13 classes", () => {
    expect([...ACTIVE_TIER_SET_IDS].sort((a, b) => a - b)).toEqual([
      2055, 2056, 2057, 2058, 2059, 2060, 2061, 2062, 2063, 2064, 2065, 2066,
      2067
    ]);
  });
});

describe("deriveSeasonTierGoal", () => {
  it("maps complete current-season 4pc", () => {
    const tier = deriveTierOverviewState({
      level: 90,
      slots: ["HEAD", "SHOULDER", "CHEST", "HANDS"].map((slotKey) => ({
        slotKey,
        expansionId: 12,
        setId: 2065,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: null,
        uniqueCategoryId: null,
        uniquenessResolved: null
      }))
    });

    expect(deriveSeasonTierGoal(tier)).toMatchObject({
      state: "COMPLETE",
      label: "✓ 4/4",
      actionLabel: null
    });
  });

  it("maps partial current-season progress", () => {
    const tier = deriveTierOverviewState({
      level: 90,
      slots: ["HEAD", "CHEST"].map((slotKey) => ({
        slotKey,
        expansionId: 12,
        setId: 2057,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: null,
        uniqueCategoryId: null,
        uniquenessResolved: null
      }))
    });

    expect(deriveSeasonTierGoal(tier)).toMatchObject({
      state: "INCOMPLETE",
      label: "2/4",
      actionLabel: "Complete 4pc tier set"
    });
  });

  it("maps proven zero current-season pieces to 0/4", () => {
    const tier = deriveTierOverviewState({
      level: 90,
      slots: [
        {
          slotKey: "HEAD",
          expansionId: 12,
          setId: 1981,
          setEvidenceResolved: true,
          setBonusResolved: true,
          setBonusSpellIds: null,
          uniqueCategoryId: null,
          uniquenessResolved: null
        }
      ]
    });

    expect(deriveSeasonTierGoal(tier)).toMatchObject({
      state: "INCOMPLETE",
      label: "0/4",
      actionLabel: "Complete 4pc tier set"
    });
  });

  it("never counts old-season pieces as 4/4", () => {
    const tier = deriveTierOverviewState({
      level: 90,
      slots: ["HEAD", "SHOULDER", "CHEST", "HANDS"].map((slotKey) => ({
        slotKey,
        expansionId: 12,
        setId: 1981,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: null,
        uniqueCategoryId: null,
        uniquenessResolved: null
      }))
    });

    expect(deriveSeasonTierGoal(tier).label).toBe("0/4");
    expect(deriveSeasonTierGoal(tier).state).toBe("INCOMPLETE");
  });

  it("maps unresolved gear evidence to UNKNOWN", () => {
    const tier = deriveTierOverviewState({
      level: 90,
      slots: [
        {
          slotKey: "HEAD",
          expansionId: 12,
          setId: 2065,
          setEvidenceResolved: false,
          setBonusResolved: null,
          setBonusSpellIds: null,
          uniqueCategoryId: null,
          uniquenessResolved: null
        }
      ]
    });

    expect(deriveSeasonTierGoal(tier)).toMatchObject({
      state: "UNKNOWN",
      label: "?",
      actionLabel: null
    });
  });

  it("caps display at ✓ 4/4 when more than 4 pieces owned", () => {
    const tier = deriveTierOverviewState({
      level: 90,
      slots: ["HEAD", "SHOULDER", "CHEST", "HANDS", "LEGS"].map((slotKey) => ({
        slotKey,
        expansionId: 12,
        setId: 2065,
        setEvidenceResolved: true,
        setBonusResolved: true,
        setBonusSpellIds: null,
        uniqueCategoryId: null,
        uniquenessResolved: null
      }))
    });

    expect(deriveSeasonTierGoal(tier).label).toBe("✓ 4/4");
    expect(deriveSeasonTierGoal(tier).label).not.toBe("5/4");
  });

  it("integrates incomplete Tier into STATUS open and ACTION", () => {
    const tier = deriveSeasonTierGoal(
      deriveTierOverviewState({
        level: 90,
        slots: ["HEAD", "CHEST"].map((slotKey) => ({
          slotKey,
          expansionId: 12,
          setId: 2065,
          setEvidenceResolved: true,
          setBonusResolved: true,
          setBonusSpellIds: null,
          uniqueCategoryId: null,
          uniquenessResolved: null
        }))
      })
    );

    const summary = summarizeSeasonGoals([
      tier,
      completeGoal("mplus"),
      completeGoal("portals"),
      completeGoal("catalyst"),
      completeGoal("cracked"),
      completeGoal("nemesis"),
      completeGoal("raid")
    ]);

    expect(summary).toEqual({
      goalsOpen: 1,
      goalsComplete: 6,
      goalsUnknown: 0,
      action: "Complete 4pc tier set"
    });
  });

  it("integrates UNKNOWN Tier into STATUS unknown and no Tier action", () => {
    const tier = deriveSeasonTierGoal(
      deriveTierOverviewState({
        level: 90,
        slots: [
          {
            slotKey: "HEAD",
            expansionId: 12,
            setId: 2065,
            setEvidenceResolved: false,
            setBonusResolved: null,
            setBonusSpellIds: null,
            uniqueCategoryId: null,
            uniquenessResolved: null
          }
        ]
      })
    );

    const summary = summarizeSeasonGoals([
      tier,
      completeGoal("mplus"),
      completeGoal("portals"),
      completeGoal("catalyst"),
      completeGoal("cracked"),
      completeGoal("nemesis"),
      completeGoal("raid")
    ]);

    expect(summary).toEqual({
      goalsOpen: 0,
      goalsComplete: 6,
      goalsUnknown: 1,
      action: null
    });
  });
});
