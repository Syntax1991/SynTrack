import { describe, expect, it } from "vitest";
import {
  aggregateProfessionHealth,
  characterNeedsRefresh,
  resolveCharacterHealth,
  resolveGearHealth,
  resolveTimestampFreshness
} from "./data-health.mapper.js";

const periodStartsAt = new Date(
  "2026-08-26T07:00:00.000Z"
);

describe("resolveTimestampFreshness", () => {
  it("is NEVER_CAPTURED when there is no timestamp at all", () => {
    expect(
      resolveTimestampFreshness(
        null,
        periodStartsAt
      )
    ).toBe("NEVER_CAPTURED");
  });

  it("is FRESH when captured during the current period", () => {
    expect(
      resolveTimestampFreshness(
        new Date(
          "2026-08-27T00:00:00.000Z"
        ),
        periodStartsAt
      )
    ).toBe("FRESH");
  });

  it("is STALE when captured before the current period started", () => {
    expect(
      resolveTimestampFreshness(
        new Date(
          "2026-08-20T00:00:00.000Z"
        ),
        periodStartsAt
      )
    ).toBe("STALE");
  });
});

describe("resolveCharacterHealth", () => {
  it("is MANUAL for a MANUAL-sourced character regardless of timestamp, never STALE/NEVER_CAPTURED", () => {
    expect(
      resolveCharacterHealth(
        "MANUAL",
        null,
        periodStartsAt
      )
    ).toBe("MANUAL");
  });

  it("is NEVER_CAPTURED for an ADDON character with no sync timestamp", () => {
    expect(
      resolveCharacterHealth(
        "ADDON",
        null,
        periodStartsAt
      )
    ).toBe("NEVER_CAPTURED");
  });

  it("is FRESH/STALE for an ADDON character based on the boundary", () => {
    expect(
      resolveCharacterHealth(
        "ADDON",
        new Date(
          "2026-08-27T00:00:00.000Z"
        ),
        periodStartsAt
      )
    ).toBe("FRESH");

    expect(
      resolveCharacterHealth(
        "ADDON",
        new Date(
          "2026-08-01T00:00:00.000Z"
        ),
        periodStartsAt
      )
    ).toBe("STALE");
  });
});

describe("aggregateProfessionHealth", () => {
  it("is NOT_TRACKED when the character has no professions assigned", () => {
    expect(
      aggregateProfessionHealth([])
    ).toBe("NOT_TRACKED");
  });

  it("is FRESH when every assigned profession is FRESH", () => {
    expect(
      aggregateProfessionHealth([
        {
          professionId: "a",
          name: "Alchemy",
          state: "FRESH",
          lastSyncedAt: null
        },
        {
          professionId: "b",
          name: "Leatherworking",
          state: "FRESH",
          lastSyncedAt: null
        }
      ])
    ).toBe("FRESH");
  });

  it("is STALE when every assigned profession is STALE", () => {
    expect(
      aggregateProfessionHealth([
        {
          professionId: "a",
          name: "Alchemy",
          state: "STALE",
          lastSyncedAt: null
        },
        {
          professionId: "b",
          name: "Leatherworking",
          state: "STALE",
          lastSyncedAt: null
        }
      ])
    ).toBe("STALE");
  });

  it("is NEVER_CAPTURED when every assigned profession was never captured", () => {
    expect(
      aggregateProfessionHealth([
        {
          professionId: "a",
          name: "Alchemy",
          state: "NEVER_CAPTURED",
          lastSyncedAt: null
        }
      ])
    ).toBe("NEVER_CAPTURED");
  });

  it("is PARTIAL when one profession is FRESH and another is NEVER_CAPTURED (the exact Alchemy/Leatherworking example)", () => {
    expect(
      aggregateProfessionHealth([
        {
          professionId: "alchemy",
          name: "Alchemy",
          state: "FRESH",
          lastSyncedAt:
            "2026-08-27T00:00:00.000Z"
        },
        {
          professionId:
            "leatherworking",
          name: "Leatherworking",
          state: "NEVER_CAPTURED",
          lastSyncedAt: null
        }
      ])
    ).toBe("PARTIAL");
  });

  it("is PARTIAL when professions disagree between FRESH and STALE", () => {
    expect(
      aggregateProfessionHealth([
        {
          professionId: "a",
          name: "Alchemy",
          state: "FRESH",
          lastSyncedAt: null
        },
        {
          professionId: "b",
          name: "Leatherworking",
          state: "STALE",
          lastSyncedAt: null
        }
      ])
    ).toBe("PARTIAL");
  });
});

describe("resolveGearHealth", () => {
  it("is NOT_TRACKED when the character has zero gear rows", () => {
    expect(
      resolveGearHealth(
        0,
        null,
        periodStartsAt
      )
    ).toBe("NOT_TRACKED");
  });

  it("is MANUAL when gear rows exist but none carry a capture timestamp", () => {
    expect(
      resolveGearHealth(
        5,
        null,
        periodStartsAt
      )
    ).toBe("MANUAL");
  });

  it("evaluates FRESH/STALE once a real capture timestamp exists", () => {
    expect(
      resolveGearHealth(
        5,
        new Date(
          "2026-08-27T00:00:00.000Z"
        ),
        periodStartsAt
      )
    ).toBe("FRESH");
  });
});

describe("characterNeedsRefresh", () => {
  it("is false for a MANUAL character even with no sync timestamp", () => {
    expect(
      characterNeedsRefresh({
        characterId: "char-1",
        character: {
          state: "MANUAL",
          lastSyncedAt: null
        },
        professions: {
          state: "NOT_TRACKED",
          items: []
        },
        gear: {
          state: "NOT_TRACKED",
          lastSyncedAt: null
        },
        resources: {
          state: "NOT_TRACKED",
          lastSyncedAt: null
        }
      })
    ).toBe(false);
  });

  it("is true for an ADDON character that is STALE or NEVER_CAPTURED", () => {
    expect(
      characterNeedsRefresh({
        characterId: "char-1",
        character: {
          state: "STALE",
          lastSyncedAt: null
        },
        professions: {
          state: "NOT_TRACKED",
          items: []
        },
        gear: {
          state: "NOT_TRACKED",
          lastSyncedAt: null
        },
        resources: {
          state: "NOT_TRACKED",
          lastSyncedAt: null
        }
      })
    ).toBe(true);
  });
});
