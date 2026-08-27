import { describe, expect, it } from "vitest";
import {
  deriveAttentionNeeded,
  deriveWeeklyComplete,
  deriveWeeklyRemaining
} from "./resource-status.mapper.js";

describe("deriveWeeklyRemaining", () => {
  it("computes remaining from known values", () => {
    expect(deriveWeeklyRemaining(40, 90)).toBe(50);
  });

  it("returns 0 rather than negative when already over cap", () => {
    expect(deriveWeeklyRemaining(95, 90)).toBe(0);
  });

  it("returns null (not 0) when weeklyQuantity is unknown", () => {
    expect(deriveWeeklyRemaining(null, 90)).toBeNull();
  });

  it("returns null (not 0) when maxWeeklyQuantity is unknown", () => {
    expect(deriveWeeklyRemaining(40, null)).toBeNull();
  });
});

describe("deriveWeeklyComplete", () => {
  it("prefers Blizzard's own dedicated isWeeklyCapped evidence when available", () => {
    expect(deriveWeeklyComplete(true, 10, 90)).toBe(true);
    expect(deriveWeeklyComplete(false, 90, 90)).toBe(false);
  });

  it("falls back to comparing quantities when isWeeklyCapped is unknown", () => {
    expect(deriveWeeklyComplete(null, 90, 90)).toBe(true);
    expect(deriveWeeklyComplete(null, 40, 90)).toBe(false);
  });

  it("returns null (not false) when neither the dedicated flag nor both quantities are known", () => {
    expect(deriveWeeklyComplete(null, null, 90)).toBeNull();
    expect(deriveWeeklyComplete(null, 40, null)).toBeNull();
  });
});

describe("deriveAttentionNeeded", () => {
  it("flags attention only for a proven-incomplete weekly resource", () => {
    expect(deriveAttentionNeeded(false)).toBe(true);
  });

  it("does not flag attention for a proven-complete resource", () => {
    expect(deriveAttentionNeeded(true)).toBe(false);
  });

  it("never flags attention from an unknown weekly state", () => {
    expect(deriveAttentionNeeded(null)).toBe(false);
  });
});
