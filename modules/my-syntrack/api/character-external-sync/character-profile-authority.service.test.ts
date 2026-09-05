import { describe, expect, it, vi } from "vitest";
import { CharacterProfileAuthorityService } from "./character-profile-authority.service.js";

function createHarness(snapshot: unknown) {
  const findOne = vi.fn(async () => snapshot);
  const service = new CharacterProfileAuthorityService({ findOne } as never);
  return { service, findOne };
}

const characterRow = {
  name: "Synblast",
  realm: "Antonidas",
  region: "eu",
  level: 88,
  className: "Shaman"
};

const freshSnapshot = {
  payload: {
    level: 90,
    className: "Shaman",
    raceName: "Dark Iron Dwarf",
    faction: "ALLIANCE",
    activeSpecName: "Restoration",
    guildName: "Before the Storm",
    guildRealmSlug: "thrall",
    averageItemLevel: 317,
    equippedItemLevel: 317
  },
  fetchedAt: new Date(),
  lastStatus: "SUCCESS" as const,
  lastAttemptAt: new Date(),
  lastError: null
};

describe("CharacterProfileAuthorityService", () => {
  it("prefers BLIZZARD facts, including the fresher level, when a fresh snapshot exists", async () => {
    const harness = createHarness(freshSnapshot);

    const result = await harness.service.getAuthoritativeProfile(
      "char-1",
      characterRow
    );

    expect(result.source).toBe("BLIZZARD");
    expect(result.level).toBe(90); // Blizzard's fresher value, not the Character row's 88
    expect(result.race).toBe("Dark Iron Dwarf");
    expect(result.guild).toEqual({ name: "Before the Storm", realmSlug: "thrall" });
    expect(result.isStale).toBe(false);
  });

  it("never touches SynTrack's own tracking identity (name/realm/region)", async () => {
    const harness = createHarness(freshSnapshot);

    const result = await harness.service.getAuthoritativeProfile(
      "char-1",
      characterRow
    );

    expect(result.name).toBe("Synblast");
    expect(result.realm).toBe("Antonidas");
    expect(result.region).toBe("eu");
  });

  it("falls back to the Character row's level/class when no Blizzard snapshot has ever succeeded", async () => {
    const harness = createHarness(null);

    const result = await harness.service.getAuthoritativeProfile(
      "char-1",
      characterRow
    );

    expect(result.source).toBe("NONE");
    expect(result.level).toBe(88);
    expect(result.class).toBe("Shaman");
    expect(result.race).toBeNull();
    expect(result.guild).toBeNull();
  });

  it("keeps serving the last successful snapshot after a failed refresh attempt", async () => {
    const harness = createHarness({
      ...freshSnapshot,
      lastStatus: "FAILED",
      lastError: "Battle.net 503"
    });

    const result = await harness.service.getAuthoritativeProfile(
      "char-1",
      characterRow
    );

    expect(result.source).toBe("BLIZZARD");
    expect(result.level).toBe(90);
  });

  it("falls back to the Character row's level/class once stale, but keeps race/guild from the stale snapshot", async () => {
    const staleSnapshot = {
      ...freshSnapshot,
      fetchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    };
    const harness = createHarness(staleSnapshot);

    const result = await harness.service.getAuthoritativeProfile(
      "char-1",
      characterRow
    );

    expect(result.isStale).toBe(true);
    // level/class: real fallback exists (the Character row) -> use it
    expect(result.level).toBe(88);
    expect(result.class).toBe("Shaman");
    // race/guild: no fallback exists -> still serve the stale value
    expect(result.race).toBe("Dark Iron Dwarf");
    expect(result.guild).toEqual({ name: "Before the Storm", realmSlug: "thrall" });
  });

  it("exposes Blizzard's last-login timestamp for cross-domain recency comparisons", async () => {
    const harness = createHarness({
      ...freshSnapshot,
      payload: { ...freshSnapshot.payload, lastLoginTimestamp: 1788481543000 }
    });

    const result = await harness.service.getAuthoritativeProfile("char-1", characterRow);

    expect(result.lastLoginAt).toEqual(new Date(1788481543000));
  });

  it("falls back to the Character row's level/class when the addon observed a newer login than Blizzard's snapshot reflects, even though the snapshot itself is not stale", async () => {
    const blizzardLastLogin = new Date("2026-09-01T00:00:00Z");
    const addonLastSyncedAt = new Date("2026-09-04T00:00:00Z");

    const harness = createHarness({
      ...freshSnapshot,
      payload: { ...freshSnapshot.payload, lastLoginTimestamp: blizzardLastLogin.getTime() }
    });

    const result = await harness.service.getAuthoritativeProfile("char-1", {
      ...characterRow,
      lastSyncedAt: addonLastSyncedAt
    });

    expect(result.isStale).toBe(false); // fetch itself is fresh
    expect(result.level).toBe(88); // but addon fallback wins: it observed a newer login
    expect(result.class).toBe("Shaman");
    // race/guild have no fallback - still served from Blizzard regardless
    expect(result.race).toBe("Dark Iron Dwarf");
  });

  it("keeps using BLIZZARD level/class when the addon's own sync is not newer than Blizzard's last login", async () => {
    const blizzardLastLogin = new Date("2026-09-04T00:25:43.000Z");
    const addonLastSyncedAt = new Date("2026-09-04T00:25:40.000Z");

    const harness = createHarness({
      ...freshSnapshot,
      payload: { ...freshSnapshot.payload, lastLoginTimestamp: blizzardLastLogin.getTime() }
    });

    const result = await harness.service.getAuthoritativeProfile("char-1", {
      ...characterRow,
      lastSyncedAt: addonLastSyncedAt
    });

    expect(result.level).toBe(90); // Blizzard's value, unaffected
  });

  it("degrades gracefully to the pre-existing fetchedAt-only check when the caller doesn't supply lastSyncedAt", async () => {
    const harness = createHarness({
      ...freshSnapshot,
      payload: { ...freshSnapshot.payload, lastLoginTimestamp: Date.now() }
    });

    const result = await harness.service.getAuthoritativeProfile("char-1", characterRow);

    expect(result.level).toBe(90); // no addonObservedAt to compare -> guard never triggers
  });

  it("getLastLoginAtMap returns each character's Blizzard last-login moment without resolving level/class", async () => {
    const findOne = vi.fn(async (characterId: string) =>
      characterId === "char-1"
        ? { ...freshSnapshot, payload: { ...freshSnapshot.payload, lastLoginTimestamp: 1000 } }
        : null
    );
    const service = new CharacterProfileAuthorityService({ findOne } as never);

    const map = await service.getLastLoginAtMap(["char-1", "char-2"]);

    expect(map.get("char-1")).toEqual(new Date(1000));
    expect(map.get("char-2")).toBeNull();
  });
});
