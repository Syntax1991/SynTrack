import { describe, expect, it, vi } from "vitest";
import { CharacterEquipmentAuthorityService } from "./character-equipment-authority.service.js";

function createHarness(snapshot: unknown, addonSlots: unknown[] = []) {
  const findOne = vi.fn(async () => snapshot);
  const findSlots = vi.fn(async () => addonSlots);

  const service = new CharacterEquipmentAuthorityService(
    { findOne } as never,
    { findSlots } as never
  );

  return { service, findOne, findSlots };
}

const freshBlizzardSnapshot = {
  payload: {
    averageItemLevel: 320,
    slots: [{ slotKey: "HEAD", itemName: "Crown", itemLevel: 320 }]
  },
  fetchedAt: new Date(),
  lastStatus: "SUCCESS" as const,
  lastAttemptAt: new Date(),
  lastError: null
};

describe("CharacterEquipmentAuthorityService", () => {
  it("prefers BLIZZARD when a fresh successful snapshot exists, even if ADDON data also exists", async () => {
    const harness = createHarness(freshBlizzardSnapshot, [
      { slotKey: "HEAD", itemName: "Old addon item", itemLevel: 200 }
    ]);

    const result = await harness.service.getAuthoritativeEquipment("char-1");

    expect(result.source).toBe("BLIZZARD");
    expect(result.averageItemLevel).toBe(320);
    expect(result.isStale).toBe(false);
    // Provider authority beats cross-provider freshness: ADDON is never
    // even consulted once a fresh BLIZZARD snapshot exists.
    expect(harness.findSlots).not.toHaveBeenCalled();
  });

  it("falls back to ADDON when no BLIZZARD snapshot has ever succeeded", async () => {
    const harness = createHarness(null, [
      { slotKey: "HEAD", itemName: "Addon item", itemLevel: 290 }
    ]);

    const result = await harness.service.getAuthoritativeEquipment("char-1");

    expect(result.source).toBe("ADDON");
    expect(result.averageItemLevel).toBe(290);
    expect(result.slots).toEqual([
      { slotKey: "HEAD", itemName: "Addon item", itemLevel: 290 }
    ]);
  });

  it("keeps serving the last successful BLIZZARD snapshot after a failed refresh attempt", async () => {
    // recordFailure never touches payloadJson/fetchedAt, so a snapshot
    // whose most recent attempt failed still reads exactly like a
    // successful one from here - lastStatus is irrelevant to authority.
    const harness = createHarness({
      ...freshBlizzardSnapshot,
      lastStatus: "FAILED",
      lastError: "Battle.net 503"
    });

    const result = await harness.service.getAuthoritativeEquipment("char-1");

    expect(result.source).toBe("BLIZZARD");
    expect(result.averageItemLevel).toBe(320);
  });

  it("falls back to ADDON once BLIZZARD is stale beyond the threshold and ADDON data exists", async () => {
    const staleSnapshot = {
      ...freshBlizzardSnapshot,
      fetchedAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
    };

    const harness = createHarness(staleSnapshot, [
      { slotKey: "HEAD", itemName: "Addon item", itemLevel: 305 }
    ]);

    const result = await harness.service.getAuthoritativeEquipment("char-1");

    expect(result.source).toBe("ADDON");
    expect(result.averageItemLevel).toBe(305);
  });

  it("still serves a stale BLIZZARD snapshot, flagged isStale, when ADDON has nothing either", async () => {
    const staleSnapshot = {
      ...freshBlizzardSnapshot,
      fetchedAt: new Date(Date.now() - 25 * 60 * 60 * 1000)
    };

    const harness = createHarness(staleSnapshot, []);

    const result = await harness.service.getAuthoritativeEquipment("char-1");

    expect(result.source).toBe("BLIZZARD");
    expect(result.isStale).toBe(true);
  });

  it("returns NONE, not a fabricated value, when neither source has any data", async () => {
    const harness = createHarness(null, []);

    const result = await harness.service.getAuthoritativeEquipment("char-1");

    expect(result).toEqual({
      source: "NONE",
      averageItemLevel: null,
      slots: [],
      fetchedAt: null,
      isStale: false
    });
  });
});
