import { describe, expect, it } from "vitest";
import { deriveEmbellishmentOverviewState } from "../gear-readiness/gear-tier-embellishment.deriver.js";
import type { GearTierEmbellishmentSlotInput } from "../gear-readiness/gear-tier-embellishment.deriver.js";
import { deriveSeasonEmbellishmentGoal } from "./season-checklist.embellishment.js";
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

function resolvedSlot(
  overrides: Partial<GearTierEmbellishmentSlotInput> & {
    slotKey: string;
  }
): GearTierEmbellishmentSlotInput {
  return {
    expansionId: 12,
    setId: null,
    setEvidenceResolved: true,
    setBonusResolved: true,
    setBonusSpellIds: null,
    uniqueCategoryId: null,
    uniquenessResolved: true,
    ...overrides
  };
}

describe("deriveSeasonEmbellishmentGoal", () => {
  it("maps complete embellishment setup to ✓ 2/2", () => {
    const emb = deriveEmbellishmentOverviewState({
      level: 90,
      slots: [
        resolvedSlot({
          slotKey: "WAIST",
          uniqueCategoryId: 512
        }),
        resolvedSlot({
          slotKey: "WRIST",
          uniqueCategoryId: 512
        })
      ]
    });

    expect(deriveSeasonEmbellishmentGoal(emb)).toMatchObject({
      state: "COMPLETE",
      label: "✓ 2/2",
      actionLabel: null
    });
  });

  it("maps partial embellishment progress to 1/2", () => {
    const emb = deriveEmbellishmentOverviewState({
      level: 90,
      slots: [
        resolvedSlot({
          slotKey: "WAIST",
          uniqueCategoryId: 512
        }),
        resolvedSlot({ slotKey: "HEAD" })
      ]
    });

    expect(deriveSeasonEmbellishmentGoal(emb)).toMatchObject({
      state: "INCOMPLETE",
      label: "1/2",
      actionLabel: "Complete Embellishment setup"
    });
  });

  it("maps proven zero embellishments to 0/2", () => {
    const emb = deriveEmbellishmentOverviewState({
      level: 90,
      slots: [resolvedSlot({ slotKey: "HEAD" })]
    });

    expect(deriveSeasonEmbellishmentGoal(emb)).toMatchObject({
      state: "INCOMPLETE",
      label: "0/2",
      actionLabel: "Complete Embellishment setup"
    });
  });

  it("maps unresolved uniqueness evidence to UNKNOWN", () => {
    const emb = deriveEmbellishmentOverviewState({
      level: 90,
      slots: [
        resolvedSlot({
          slotKey: "WAIST",
          uniqueCategoryId: 512,
          uniquenessResolved: false
        })
      ]
    });

    expect(deriveSeasonEmbellishmentGoal(emb)).toMatchObject({
      state: "UNKNOWN",
      label: "?",
      actionLabel: null
    });
  });

  it("caps display at ✓ 2/2 when more than 2 embellished pieces are equipped", () => {
    const emb = deriveEmbellishmentOverviewState({
      level: 90,
      slots: [
        resolvedSlot({
          slotKey: "WAIST",
          uniqueCategoryId: 512
        }),
        resolvedSlot({
          slotKey: "WRIST",
          uniqueCategoryId: 512
        }),
        resolvedSlot({
          slotKey: "NECK",
          uniqueCategoryId: 512
        })
      ]
    });

    expect(deriveSeasonEmbellishmentGoal(emb).label).toBe("✓ 2/2");
    expect(deriveSeasonEmbellishmentGoal(emb).label).not.toBe("3/2");
  });

  it("integrates incomplete Emb into STATUS open and ACTION when Tier is complete", () => {
    const emb = deriveSeasonEmbellishmentGoal(
      deriveEmbellishmentOverviewState({
        level: 90,
        slots: [
          resolvedSlot({
            slotKey: "WAIST",
            uniqueCategoryId: 512
          }),
          resolvedSlot({ slotKey: "HEAD" })
        ]
      })
    );

    const summary = summarizeSeasonGoals([
      completeGoal("tier"),
      emb,
      completeGoal("mplus"),
      completeGoal("portals"),
      completeGoal("catalyst"),
      completeGoal("cracked"),
      completeGoal("nemesis"),
      completeGoal("raid")
    ]);

    expect(summary).toEqual({
      goalsOpen: 1,
      goalsComplete: 7,
      goalsUnknown: 0,
      action: "Complete Embellishment setup"
    });
  });

  it("integrates UNKNOWN Emb into STATUS unknown and no Emb action", () => {
    const emb = deriveSeasonEmbellishmentGoal(
      deriveEmbellishmentOverviewState({
        level: 90,
        slots: [
          resolvedSlot({
            slotKey: "WAIST",
            uniqueCategoryId: 512,
            uniquenessResolved: false
          })
        ]
      })
    );

    const summary = summarizeSeasonGoals([
      completeGoal("tier"),
      emb,
      completeGoal("mplus"),
      completeGoal("portals"),
      completeGoal("catalyst"),
      completeGoal("cracked"),
      completeGoal("nemesis"),
      completeGoal("raid")
    ]);

    expect(summary).toEqual({
      goalsOpen: 0,
      goalsComplete: 7,
      goalsUnknown: 1,
      action: null
    });
  });
});
