import { describe, expect, it } from "vitest";
import {
  formatEmbellishmentToken,
  formatGearToken,
  formatProfessionToken,
  formatTierToken,
  formatVaultToken
} from "./overviewCellFormatting";

describe("overviewCellFormatting", () => {
  it("never renders a NOT_TRACKED profession/gear domain as Ready - the tone and symbol stay quiet, not green", () => {
    const profession = formatProfessionToken({
      state: "NOT_TRACKED",
      issueCount: 0,
      issues: [],
      items: []
    });

    const gear = formatGearToken({
      state: "NOT_TRACKED",
      readinessPercent: null,
      trackedSlots: 0,
      totalRelevantSlots: 16,
      missingEnchantCount: 0,
      emptySocketCount: 0,
      itemLevel: null
    });

    expect(profession.tone).toBe("not-tracked");
    expect(profession.symbol).not.toBe("✓");
    expect(gear.tone).toBe("not-tracked");
    expect(gear.symbol).not.toBe("✓");
  });

  it("formats Set/Embellishments as —, ?, or N/target", () => {
    expect(
      formatTierToken({
        state: "NOT_TRACKED",
        equippedPieces: 0,
        targetPieces: 4,
        twoPiece: false,
        fourPiece: false,
        rawEquippedPieces: 0
      })
    ).toMatchObject({ symbol: "—", tone: "not-tracked" });

    expect(
      formatTierToken({
        state: "UNKNOWN",
        equippedPieces: 0,
        targetPieces: 4,
        twoPiece: false,
        fourPiece: false,
        rawEquippedPieces: 0
      })
    ).toMatchObject({ symbol: "?", tone: "unknown" });

    expect(
      formatTierToken({
        state: "IN_PROGRESS",
        equippedPieces: 2,
        targetPieces: 4,
        twoPiece: true,
        fourPiece: false,
        rawEquippedPieces: 2
      })
    ).toMatchObject({ symbol: "2/4", tone: "progress" });

    expect(
      formatTierToken({
        state: "READY",
        equippedPieces: 4,
        targetPieces: 4,
        twoPiece: true,
        fourPiece: true,
        rawEquippedPieces: 5
      })
    ).toMatchObject({ symbol: "4/4", tone: "ready" });

    expect(
      formatEmbellishmentToken({
        state: "NOT_TRACKED",
        equippedPieces: 0,
        targetPieces: 2
      }).tone
    ).toBe("not-tracked");

    expect(
      formatEmbellishmentToken({
        state: "UNKNOWN",
        equippedPieces: 0,
        targetPieces: 2
      })
    ).toMatchObject({ symbol: "?", tone: "unknown" });

    expect(
      formatEmbellishmentToken({
        state: "IN_PROGRESS",
        equippedPieces: 1,
        targetPieces: 2
      })
    ).toMatchObject({ symbol: "1/2", tone: "progress" });
  });

  it("keeps formatGearToken available for Character Detail even without Overview Gear column", () => {
    const gear = formatGearToken({
      state: "ATTENTION",
      readinessPercent: 50,
      trackedSlots: 8,
      totalRelevantSlots: 16,
      missingEnchantCount: 0,
      emptySocketCount: 2,
      itemLevel: 680
    });

    expect(gear.symbol).toBe("!");
    expect(gear.title).toContain("empty socket");
  });

  it("keeps Vault UNKNOWN visually and semantically distinct from an explicit 0/N", () => {
    const unknown = formatVaultToken({
      state: "UNKNOWN",
      unlockedSlots: 0,
      slotsTotal: 3,
      highestKeyLevel: null,
      source: "MANUAL_LOG"
    });

    const explicitZero = formatVaultToken({
      state: "IN_PROGRESS",
      unlockedSlots: 0,
      slotsTotal: 3,
      highestKeyLevel: null,
      source: "MANUAL_LOG"
    });

    expect(unknown.symbol).toBe("?");
    expect(unknown.tone).toBe("unknown");

    expect(explicitZero.symbol).toBe("0/3");
    expect(explicitZero.tone).toBe("progress");

    expect(unknown.symbol).not.toBe(explicitZero.symbol);
    expect(unknown.tone).not.toBe(explicitZero.tone);
  });
});
