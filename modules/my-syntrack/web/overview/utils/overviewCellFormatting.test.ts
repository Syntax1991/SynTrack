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

  it("never renders Set/Embellishments (no data source yet) as Ready", () => {
    expect(
      formatTierToken({ state: "NOT_TRACKED" }).tone
    ).toBe("not-tracked");

    expect(
      formatEmbellishmentToken({
        state: "NOT_TRACKED"
      }).tone
    ).toBe("not-tracked");
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

    expect(unknown.symbol).not.toBe(
      explicitZero.symbol
    );

    expect(unknown.tone).not.toBe(
      explicitZero.tone
    );
  });
});
