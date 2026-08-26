import { describe, expect, it } from "vitest";
import {
  normalizeTrackerKey,
  normalizeTrackerScopeKey
} from "./tracker-key.js";

describe("normalizeTrackerKey", () => {
  it("lower-cases and kebab-cases a human-typed name", () => {
    expect(
      normalizeTrackerKey("World Tour")
    ).toBe("world-tour");
  });

  it("collapses repeated separators and trims leading/trailing dashes", () => {
    expect(
      normalizeTrackerKey(
        "  Delve   Quest!! "
      )
    ).toBe("delve-quest");
  });

  it("is idempotent - normalizing an already-normalized key changes nothing", () => {
    expect(
      normalizeTrackerKey("world-tour")
    ).toBe("world-tour");
  });
});

describe("normalizeTrackerScopeKey", () => {
  it("upper-cases and kebab-cases a scope label", () => {
    expect(
      normalizeTrackerScopeKey(
        "midnight s1"
      )
    ).toBe("MIDNIGHT-S1");
  });

  it("is idempotent for an already-normalized scope key", () => {
    expect(
      normalizeTrackerScopeKey(
        "GLOBAL"
      )
    ).toBe("GLOBAL");
  });
});
