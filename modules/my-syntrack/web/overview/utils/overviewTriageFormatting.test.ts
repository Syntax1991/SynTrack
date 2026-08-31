import { describe, expect, it } from "vitest";
import { formatWeeklySummaryToken } from "./overviewTriageFormatting";

const emptyDomains: Array<{
  label: string;
  state: string;
  completeCount: number;
  applicableTotal: number;
  unknownCount: number;
}> = [];

describe("formatWeeklySummaryToken", () => {
  it("shows ! when any known recurring work remains", () => {
    expect(
      formatWeeklySummaryToken({
        state: "ATTENTION",
        completedKnown: 4,
        applicableKnown: 8,
        unknownCount: 4,
        domains: emptyDomains
      }).symbol
    ).toBe("!");
  });

  it("shows ? when nothing known is incomplete but applicable state is unresolved", () => {
    expect(
      formatWeeklySummaryToken({
        state: "UNKNOWN",
        completedKnown: 4,
        applicableKnown: 8,
        unknownCount: 4,
        domains: emptyDomains
      }).symbol
    ).toBe("?");
  });

  it("shows ✓ when all applicable known recurring work is complete", () => {
    expect(
      formatWeeklySummaryToken({
        state: "READY",
        completedKnown: 8,
        applicableKnown: 8,
        unknownCount: 0,
        domains: emptyDomains
      }).symbol
    ).toBe("✓");
  });

  it("shows — when nothing applicable is tracked", () => {
    expect(
      formatWeeklySummaryToken({
        state: "NOT_TRACKED",
        completedKnown: 0,
        applicableKnown: 0,
        unknownCount: 0,
        domains: emptyDomains
      }).symbol
    ).toBe("—");
  });

  it("never uses ≥ or a mixed profession+gameplay fraction as the Overview cell", () => {
    const token = formatWeeklySummaryToken({
      state: "ATTENTION",
      completedKnown: 4,
      applicableKnown: 8,
      unknownCount: 4,
      domains: emptyDomains
    });

    expect(token.symbol).not.toContain("≥");
    expect(token.symbol).not.toContain(">=");
    expect(token.symbol).not.toBe("4/8 · 4?");
    expect(token.symbol).not.toBe("4/14");
  });
});
