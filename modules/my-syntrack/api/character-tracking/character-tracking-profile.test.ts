import { describe, expect, it } from "vitest";
import { resolveCharacterTrackingProfile } from "./character-tracking-profile.js";
import { isWeeklyGameplayEnabled } from "./domain-applicability.js";

describe("resolveCharacterTrackingProfile", () => {
  it("maps Profession tag to PROFESSION", () => {
    expect(
      resolveCharacterTrackingProfile([{ name: "Profession" }])
    ).toBe("PROFESSION");
  });

  it("maps Main tag to FULL", () => {
    expect(
      resolveCharacterTrackingProfile([{ name: "Main" }])
    ).toBe("FULL");
  });

  it("defaults to FULL when no profile tag is present", () => {
    expect(
      resolveCharacterTrackingProfile([{ name: "Healer" }])
    ).toBe("FULL");
  });

  it("prefers PROFESSION over Main when both tags exist", () => {
    expect(
      resolveCharacterTrackingProfile([
        { name: "Main" },
        { name: "Profession" }
      ])
    ).toBe("PROFESSION");
  });
});

describe("isWeeklyGameplayEnabled", () => {
  it("is enabled for FULL and WEEKLY", () => {
    expect(isWeeklyGameplayEnabled("FULL")).toBe(true);
    expect(isWeeklyGameplayEnabled("WEEKLY")).toBe(true);
  });

  it("is disabled for PROFESSION and MINIMAL", () => {
    expect(isWeeklyGameplayEnabled("PROFESSION")).toBe(false);
    expect(isWeeklyGameplayEnabled("MINIMAL")).toBe(false);
  });
});
