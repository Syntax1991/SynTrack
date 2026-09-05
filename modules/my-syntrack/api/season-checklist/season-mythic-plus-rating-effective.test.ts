import { describe, expect, it } from "vitest";
import type { AuthoritativeMythicPlusResult } from "../character-external-sync/character-external-sync.types.js";
import { withAuthoritativeMythicPlusRating } from "./season-mythic-plus-rating-effective.js";

const definition = {
  id: "def-1",
  scopeKey: "MIDNIGHT-S2",
  key: "mythic-plus-rating",
  name: "Mythic+ Rating (2,000)",
  valueType: "NUMBER" as const,
  resetBehavior: "SEASONAL" as const,
  category: "GAMEPLAY",
  sortOrder: 1,
  isPinned: true,
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

function addonResolved(numberValue: number) {
  return {
    definition,
    state: {
      trackerDefinitionId: "def-1",
      characterId: "char-1",
      periodKey: "ALWAYS",
      state: "RECORDED" as const,
      source: "ADDON",
      value: { valueType: "NUMBER" as const, number: numberValue }
    }
  };
}

function blizzardResult(rating: number | null, source: "BLIZZARD" | "ADDON" | "NONE" = "BLIZZARD"): AuthoritativeMythicPlusResult {
  return {
    source,
    rating,
    hasProfile: rating !== null,
    bestRuns: [],
    periodId: 1079,
    fetchedAt: rating !== null ? new Date() : null,
    isStale: false
  };
}

describe("withAuthoritativeMythicPlusRating", () => {
  it("uses the Blizzard-authoritative rating (already PRIMARY=BLIZZARD/FALLBACK=ADDON internally) when available", () => {
    const map = new Map([["char-1", blizzardResult(3125)]]);
    const result = withAuthoritativeMythicPlusRating(addonResolved(3100), "char-1", map);

    expect(result?.state?.value).toEqual({ valueType: "NUMBER", number: 3125 });
    expect(result?.state?.source).toBe("BLIZZARD");
  });

  it("falls back to the raw addon-resolved tracker when the authority map has no entry for this character", () => {
    const result = withAuthoritativeMythicPlusRating(addonResolved(3100), "char-1", new Map());

    expect(result?.state?.value).toEqual({ valueType: "NUMBER", number: 3100 });
  });

  it("falls back to the raw addon-resolved tracker when the authority result has no rating (NONE)", () => {
    const map = new Map([["char-1", blizzardResult(null, "NONE")]]);
    const result = withAuthoritativeMythicPlusRating(addonResolved(3100), "char-1", map);

    expect(result?.state?.value).toEqual({ valueType: "NUMBER", number: 3100 });
  });

  it("returns null when no addon tracker definition was ever bootstrapped, even with a real authoritative rating", () => {
    const map = new Map([["char-1", blizzardResult(3125)]]);
    const result = withAuthoritativeMythicPlusRating(null, "char-1", map);

    expect(result).toBeNull();
  });

  it("labels the ADDON-sourced authority result correctly when Blizzard has never succeeded but the addon fallback (inside the authority service) supplied a value", () => {
    const map = new Map([["char-1", blizzardResult(3100, "ADDON")]]);
    const result = withAuthoritativeMythicPlusRating(addonResolved(3100), "char-1", map);

    expect(result?.state?.source).toBe("ADDON");
  });

  it("never references Vault/current-week M+ models - structurally reads only the rating field", () => {
    const map = new Map([["char-1", blizzardResult(3125)]]);
    const result = withAuthoritativeMythicPlusRating(addonResolved(3100), "char-1", map);

    expect(result).not.toHaveProperty("vaultProgress");
    expect(result).not.toHaveProperty("thisWeekRuns");
  });
});
