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
});
