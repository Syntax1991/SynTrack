import { describe, expect, it } from "vitest";
import type { VaultDomainProgress } from "../types/vaultMythicPlus.types";
import {
  formatDomainProgressText,
  formatDomainSlotUnlockText
} from "./vaultCellFormatting";

function domain(
  overrides: Partial<VaultDomainProgress> = {}
): VaultDomainProgress {
  return {
    state: "ATTENTION",
    completeCount: 0,
    applicableTotal: 8,
    knownUnlockedSlots: 0,
    maxSlots: 3,
    hasUnknownCategories: false,
    unresolvedCategoryLabels: [],
    ...overrides
  };
}

describe("vault detail summary formatting", () => {
  it("keeps UNKNOWN progress as ? instead of collapsing to 0/fallback", () => {
    const unknown = domain({
      state: "UNKNOWN",
      completeCount: 0,
      applicableTotal: 0,
      knownUnlockedSlots: 0,
      maxSlots: 0
    });

    expect(formatDomainProgressText(unknown)).toBe("?");
    expect(formatDomainSlotUnlockText(unknown)).toBe("?");
  });

  it("formats known zero and known progress distinctly from UNKNOWN", () => {
    const zero = domain({
      state: "ATTENTION",
      completeCount: 0,
      applicableTotal: 8,
      knownUnlockedSlots: 0,
      maxSlots: 3
    });
    const progress = domain({
      state: "READY",
      completeCount: 8,
      applicableTotal: 8,
      knownUnlockedSlots: 3,
      maxSlots: 3
    });

    expect(formatDomainProgressText(zero)).toBe("0/8");
    expect(formatDomainSlotUnlockText(zero)).toBe("0/3");
    expect(formatDomainProgressText(progress)).toBe("8/8");
    expect(formatDomainSlotUnlockText(progress)).toBe("3/3");
  });
});
