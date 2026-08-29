import { describe, expect, it, vi } from "vitest";
import type { GearTierEmbellishmentSlotInput } from "./gear-tier-embellishment.deriver.js";

vi.mock("./embellishment-category.js", () => ({
  EMBELLISHMENT_UNIQUE_CATEGORY_ID: null
}));

const {
  deriveEmbellishmentOverviewState,
  deriveTierOverviewState
} = await import("./gear-tier-embellishment.deriver.js");

/** Midnight S2 Evoker set — in ACTIVE_TIER_SET_IDS */
const S2 = 2058;
/** Midnight S1 Evoker Black Talon — must never count */
const S1 = 1981;

function slot(
  slotKey: string,
  overrides: Partial<GearTierEmbellishmentSlotInput> = {}
): GearTierEmbellishmentSlotInput {
  return {
    slotKey,
    expansionId: 11,
    setId: null,
    setEvidenceResolved: true,
    setBonusResolved: true,
    setBonusSpellIds: [],
    uniqueCategoryId: null,
    uniquenessResolved: true,
    ...overrides
  };
}

function s2Piece(
  slotKey: string,
  extras: Partial<GearTierEmbellishmentSlotInput> = {}
) {
  return slot(slotKey, {
    setId: S2,
    setBonusSpellIds: [1001],
    ...extras
  });
}

describe("deriveTierOverviewState", () => {
  it("returns NOT_TRACKED below level 80", () => {
    expect(
      deriveTierOverviewState({
        level: 79,
        slots: [s2Piece("HEAD")]
      }).state
    ).toBe("NOT_TRACKED");
  });

  it("ignores old-season setIds even with set bonuses", () => {
    const result = deriveTierOverviewState({
      level: 90,
      slots: [
        s2Piece("HEAD"),
        s2Piece("CHEST"),
        s2Piece("HANDS"),
        slot("SHOULDER", {
          setId: S1,
          setBonusSpellIds: [1, 2]
        }),
        slot("LEGS", {
          setId: S1,
          setBonusSpellIds: [1, 2]
        })
      ]
    });

    expect(result.equippedPieces).toBe(3);
    expect(result.slots).toEqual(
      expect.arrayContaining(["HEAD", "CHEST", "HANDS"])
    );
    expect(result.slots).not.toContain("SHOULDER");
    expect(result.slots).not.toContain("LEGS");
  });

  it("counts bag pieces toward owned current-season slots", () => {
    const result = deriveTierOverviewState({
      level: 90,
      slots: [s2Piece("HEAD"), s2Piece("CHEST"), s2Piece("HANDS")],
      bagPieces: [
        {
          itemId: 1,
          setId: S2,
          expansionId: 11,
          equipLoc: "INVTYPE_SHOULDER",
          setEvidenceResolved: true
        },
        {
          itemId: 2,
          setId: S1,
          expansionId: 11,
          equipLoc: "INVTYPE_LEGS",
          setEvidenceResolved: true
        }
      ]
    });

    expect(result.equippedPieces).toBe(4);
    expect(result.slots).toEqual(
      expect.arrayContaining([
        "HEAD",
        "CHEST",
        "HANDS",
        "SHOULDER"
      ])
    );
    expect(result.slots).not.toContain("LEGS");
  });

  it("returns proven 0/4 when only old-season sets are present", () => {
    const result = deriveTierOverviewState({
      level: 90,
      slots: [
        slot("HEAD", { setId: S1, setBonusSpellIds: [1] }),
        slot("LEGS", { setId: S1, setBonusSpellIds: [1] })
      ]
    });

    expect(result.state).toBe("IN_PROGRESS");
    expect(result.equippedPieces).toBe(0);
  });

  it("returns UNKNOWN when canonical set evidence is unresolved", () => {
    expect(
      deriveTierOverviewState({
        level: 90,
        slots: [
          s2Piece("HEAD"),
          slot("SHOULDER", { setEvidenceResolved: false })
        ]
      }).state
    ).toBe("UNKNOWN");
  });

  it("caps overview at 4/4", () => {
    const result = deriveTierOverviewState({
      level: 90,
      slots: [
        s2Piece("HEAD"),
        s2Piece("SHOULDER"),
        s2Piece("CHEST"),
        s2Piece("HANDS"),
        s2Piece("LEGS")
      ]
    });

    expect(result.equippedPieces).toBe(4);
    expect(result.rawEquippedPieces).toBe(5);
    expect(result.state).toBe("READY");
  });
});

describe("deriveEmbellishmentOverviewState", () => {
  it("stays UNKNOWN while EMBELLISHMENT_UNIQUE_CATEGORY_ID is unset", () => {
    expect(
      deriveEmbellishmentOverviewState({
        level: 90,
        slots: [
          slot("WAIST", {
            uniqueCategoryId: 512,
            uniquenessResolved: true
          })
        ]
      }).state
    ).toBe("UNKNOWN");
  });
});
