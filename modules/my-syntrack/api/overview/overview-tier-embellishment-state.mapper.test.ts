import { describe, expect, it } from "vitest";
import {
  resolveEmbellishmentOverviewState,
  resolveTierOverviewState
} from "./overview-tier-embellishment-state.mapper.js";

describe("resolveTierOverviewState / resolveEmbellishmentOverviewState", () => {
  it("defaults to NOT_TRACKED when no gear input is provided", () => {
    expect(resolveTierOverviewState()).toMatchObject({
      state: "NOT_TRACKED",
      equippedPieces: 0,
      targetPieces: 4
    });

    expect(resolveEmbellishmentOverviewState()).toMatchObject({
      state: "NOT_TRACKED",
      equippedPieces: 0,
      targetPieces: 2
    });
  });

  it("derives tier progress from resolved gear evidence", () => {
    const result = resolveTierOverviewState({
      level: 80,
      currentExpansionId: 10,
      slots: [
        {
          slotKey: "HEAD",
          expansionId: 10,
          setId: 5001,
          setEvidenceResolved: true,
          setBonusResolved: true,
          setBonusSpellIds: [111],
          uniqueCategoryId: null,
          uniquenessResolved: true
        },
        {
          slotKey: "SHOULDER",
          expansionId: 10,
          setId: 5001,
          setEvidenceResolved: true,
          setBonusResolved: true,
          setBonusSpellIds: [111],
          uniqueCategoryId: null,
          uniquenessResolved: true
        }
      ]
    });

    expect(result.state).toBe("IN_PROGRESS");
    expect(result.equippedPieces).toBe(2);
    expect(result.twoPiece).toBe(true);
  });

  it("keeps embellishments UNKNOWN until category id is configured", () => {
    expect(
      resolveEmbellishmentOverviewState({
        level: 80,
        slots: [
          {
            slotKey: "FINGER_1",
            expansionId: 10,
            setId: null,
            setEvidenceResolved: true,
            setBonusResolved: true,
            setBonusSpellIds: [],
            uniqueCategoryId: null,
            uniquenessResolved: true
          }
        ]
      }).state
    ).toBe("UNKNOWN");
  });
});
