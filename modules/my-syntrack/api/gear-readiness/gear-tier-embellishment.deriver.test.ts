import { describe, expect, it, vi } from "vitest";
import type { GearTierEmbellishmentSlotInput } from "./gear-tier-embellishment.deriver.js";

vi.mock("./embellishment-category.js", () => ({
  EMBELLISHMENT_UNIQUE_CATEGORY_ID: null
}));

const {
  deriveEmbellishmentOverviewState,
  deriveTierOverviewState
} = await import("./gear-tier-embellishment.deriver.js");

function slot(
  slotKey: string,
  overrides: Partial<GearTierEmbellishmentSlotInput> = {}
): GearTierEmbellishmentSlotInput {
  return {
    slotKey,
    expansionId: 10,
    setId: null,
    setEvidenceResolved: true,
    setBonusResolved: true,
    setBonusSpellIds: [],
    uniqueCategoryId: null,
    uniquenessResolved: true,
    ...overrides
  };
}

function tierPiece(
  slotKey: string,
  setId: number,
  extras: Partial<GearTierEmbellishmentSlotInput> = {}
) {
  return slot(slotKey, {
    setId,
    setBonusSpellIds: [1001],
    setBonusResolved: true,
    expansionId: 10,
    ...extras
  });
}

describe("deriveTierOverviewState", () => {
  it("returns NOT_TRACKED below level 80", () => {
    expect(
      deriveTierOverviewState({
        level: 79,
        slots: [tierPiece("HEAD", 1)],
        currentExpansionId: 10
      }).state
    ).toBe("NOT_TRACKED");
  });

  it("returns NOT_TRACKED when no gear slots exist", () => {
    expect(
      deriveTierOverviewState({
        level: 80,
        slots: [],
        currentExpansionId: 10
      }).state
    ).toBe("NOT_TRACKED");
  });

  it("returns UNKNOWN when any canonical slot has unresolved set evidence", () => {
    const result = deriveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [
        tierPiece("HEAD", 1),
        slot("SHOULDER", {
          setEvidenceResolved: false,
          setId: 1
        })
      ]
    });

    expect(result.state).toBe("UNKNOWN");
  });

  it("Level A: confirms current-expansion pieces with non-empty set bonuses", () => {
    const result = deriveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [
        tierPiece("HEAD", 5001),
        tierPiece("SHOULDER", 5001),
        slot("NECK", { setId: null })
      ]
    });

    expect(result.state).toBe("IN_PROGRESS");
    expect(result.equippedPieces).toBe(2);
    expect(result.twoPiece).toBe(true);
    expect(result.fourPiece).toBe(false);
  });

  it("Level A ignores old-expansion pieces even with bonuses", () => {
    const result = deriveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [tierPiece("HEAD", 5001, { expansionId: 9 })]
    });

    expect(result.equippedPieces).toBe(0);
    expect(result.state).toBe("IN_PROGRESS");
  });

  it("Level B: same setId on >=2 resolved canonical slots counts without bonuses", () => {
    const result = deriveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [
        slot("HEAD", {
          setId: 77,
          setBonusSpellIds: [],
          setBonusResolved: true
        }),
        slot("CHEST", {
          setId: 77,
          setBonusSpellIds: null,
          setBonusResolved: false
        }),
        slot("LEGS", {
          setId: 77,
          setBonusSpellIds: [],
          setBonusResolved: true
        })
      ]
    });

    expect(result.equippedPieces).toBe(3);
    expect(result.rawEquippedPieces).toBe(3);
  });

  it("prefers a Level B setId that also has Level A evidence", () => {
    const result = deriveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [
        tierPiece("HEAD", 100),
        tierPiece("SHOULDER", 100),
        slot("CHEST", { setId: 200 }),
        slot("HANDS", { setId: 200 }),
        slot("LEGS", { setId: 200 })
      ]
    });

    expect(result.equippedPieces).toBe(2);
    expect(result.slots).toEqual(["HEAD", "SHOULDER"]);
  });

  it("caps overview equippedPieces at 4 while tracking raw including 5", () => {
    const result = deriveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [
        tierPiece("HEAD", 1),
        tierPiece("SHOULDER", 1),
        tierPiece("CHEST", 1),
        tierPiece("HANDS", 1),
        tierPiece("LEGS", 1)
      ]
    });

    expect(result.equippedPieces).toBe(4);
    expect(result.rawEquippedPieces).toBe(5);
    expect(result.fourPiece).toBe(true);
    expect(result.state).toBe("READY");
  });

  it("returns proven 0/4 when all resolved and no tier set matches", () => {
    const result = deriveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [
        slot("HEAD", { setId: null }),
        slot("SHOULDER", { setId: 1, setBonusSpellIds: [] }),
        slot("BACK", { setId: 1 })
      ]
    });

    expect(result.state).toBe("IN_PROGRESS");
    expect(result.equippedPieces).toBe(0);
    expect(result.targetPieces).toBe(4);
  });

  it("uses max resolved expansionId when currentExpansionId is omitted", () => {
    const result = deriveTierOverviewState({
      level: 90,
      slots: [
        tierPiece("HEAD", 9, { expansionId: 9 }),
        tierPiece("SHOULDER", 10, { expansionId: 10 }),
        tierPiece("CHEST", 10, { expansionId: 10 })
      ]
    });

    expect(result.equippedPieces).toBe(2);
  });
});

describe("deriveEmbellishmentOverviewState", () => {
  it("returns NOT_TRACKED without gear or below level", () => {
    expect(
      deriveEmbellishmentOverviewState({ level: 70, slots: [slot("HEAD")] })
        .state
    ).toBe("NOT_TRACKED");

    expect(
      deriveEmbellishmentOverviewState({ level: 80, slots: [] }).state
    ).toBe("NOT_TRACKED");
  });

  it("stays UNKNOWN while EMBELLISHMENT_UNIQUE_CATEGORY_ID is unset", () => {
    const result = deriveEmbellishmentOverviewState({
      level: 80,
      slots: [
        slot("FINGER_1", {
          uniquenessResolved: true,
          uniqueCategoryId: null
        })
      ]
    });

    expect(result.state).toBe("UNKNOWN");
  });
});
