import { describe, expect, it } from "vitest";
import { isBlizzardObservationBehindAddon } from "./character-blizzard-recency.js";

describe("isBlizzardObservationBehindAddon", () => {
  it("returns true when the addon observed the character strictly after Blizzard's last known login", () => {
    const blizzardLastLoginAt = new Date("2026-09-01T00:00:00Z");
    const addonObservedAt = new Date("2026-09-04T00:00:00Z");

    expect(isBlizzardObservationBehindAddon(blizzardLastLoginAt, addonObservedAt)).toBe(true);
  });

  it("returns false when Blizzard's last login is after the addon's observation (Blizzard is at least as current)", () => {
    const blizzardLastLoginAt = new Date("2026-09-04T00:25:43.000Z");
    const addonObservedAt = new Date("2026-09-04T00:25:40.000Z");

    expect(isBlizzardObservationBehindAddon(blizzardLastLoginAt, addonObservedAt)).toBe(false);
  });

  it("returns false when the two timestamps are exactly equal", () => {
    const timestamp = new Date("2026-09-04T00:00:00Z");

    expect(isBlizzardObservationBehindAddon(timestamp, timestamp)).toBe(false);
  });

  it("returns false when either timestamp is missing (never claims Blizzard is behind without evidence)", () => {
    const timestamp = new Date("2026-09-04T00:00:00Z");

    expect(isBlizzardObservationBehindAddon(null, timestamp)).toBe(false);
    expect(isBlizzardObservationBehindAddon(timestamp, null)).toBe(false);
    expect(isBlizzardObservationBehindAddon(null, null)).toBe(false);
  });
});
