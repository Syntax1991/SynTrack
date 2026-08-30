import { describe, expect, it } from "vitest";
import {
  isWeeklyGameplayDomainEnabled,
  isWeeklyGameplayEnabled,
  resolveWeeklyGameplayDomainApplicability
} from "./domain-applicability.js";

const gameplayDomains = [
  "vault",
  "mythic-plus",
  "raid",
  "delves"
] as const;

describe("resolveWeeklyGameplayDomainApplicability", () => {
  it("enables gameplay domains for FULL and WEEKLY profiles", () => {
    for (const profile of ["FULL", "WEEKLY"] as const) {
      for (const domain of gameplayDomains) {
        expect(
          resolveWeeklyGameplayDomainApplicability(profile, domain)
        ).toBe("ENABLED");
      }
    }
  });

  it("disables gameplay domains for PROFESSION and MINIMAL profiles", () => {
    for (const profile of ["PROFESSION", "MINIMAL"] as const) {
      for (const domain of gameplayDomains) {
        expect(
          resolveWeeklyGameplayDomainApplicability(profile, domain)
        ).toBe("DISABLED_BY_PROFILE");
      }
    }
  });
});

describe("isWeeklyGameplayEnabled", () => {
  it("is true only for FULL and WEEKLY", () => {
    expect(isWeeklyGameplayEnabled("FULL")).toBe(true);
    expect(isWeeklyGameplayEnabled("WEEKLY")).toBe(true);
    expect(isWeeklyGameplayEnabled("PROFESSION")).toBe(false);
    expect(isWeeklyGameplayEnabled("MINIMAL")).toBe(false);
  });
});

describe("isWeeklyGameplayDomainEnabled", () => {
  it("matches profile-level gameplay enablement for every domain", () => {
    for (const domain of gameplayDomains) {
      expect(isWeeklyGameplayDomainEnabled("FULL", domain)).toBe(true);
      expect(
        isWeeklyGameplayDomainEnabled("PROFESSION", domain)
      ).toBe(false);
    }
  });
});
