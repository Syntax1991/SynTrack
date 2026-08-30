import { describe, expect, it } from "vitest";
import {
  formatKnownWeeklyProgressSymbol,
  formatVaultSlotSymbol
} from "./weekly-progress-display.js";

describe("formatVaultSlotSymbol", () => {
  it("renders ≥6/9 for proven slots with an unresolved category", () => {
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: 6,
        maxSlots: 9,
        hasUnknownCategories: true
      })
    ).toBe("≥6/9");
  });

  it("renders an exact fraction when every category is known", () => {
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: 9,
        maxSlots: 9,
        hasUnknownCategories: false
      })
    ).toBe("9/9");
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: 6,
        maxSlots: 9,
        hasUnknownCategories: false
      })
    ).toBe("6/9");
  });

  it("renders ? when no slot model exists", () => {
    expect(
      formatVaultSlotSymbol({
        knownUnlockedSlots: 0,
        maxSlots: 0,
        hasUnknownCategories: false
      })
    ).toBe("?");
  });
});

describe("formatKnownWeeklyProgressSymbol", () => {
  it("keeps UNKNOWN out of the numeric denominator", () => {
    expect(
      formatKnownWeeklyProgressSymbol({
        completedKnown: 4,
        applicableKnown: 8,
        unknownCount: 2
      })
    ).toBe("4/8 · 2?");
  });
});
