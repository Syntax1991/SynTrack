import { describe, expect, it, vi } from "vitest";
import { applyAuthoritativeProfile } from "./overview-profile-effective.js";
import type { CharacterWeeklyState } from "./overview.types.js";

function characterEntry(
  overrides: Partial<CharacterWeeklyState["character"]> = {}
): CharacterWeeklyState {
  return {
    character: {
      id: "char-1",
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      className: "Shaman",
      level: 80,
      ...overrides
    }
  } as unknown as CharacterWeeklyState;
}

describe("applyAuthoritativeProfile", () => {
  it("overrides className/level with Blizzard-authoritative values when a fresh snapshot exists", async () => {
    const getAuthoritativeProfile = vi.fn(async () => ({
      source: "BLIZZARD" as const,
      fetchedAt: new Date(),
      isStale: false,
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      level: 90,
      class: "Shaman",
      race: "Dark Iron Dwarf",
      faction: "ALLIANCE",
      activeSpec: "Restoration",
      guild: null,
      averageItemLevel: 317,
      equippedItemLevel: 317
    }));

    const characters = [characterEntry()];
    await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

    expect(characters[0]!.character.level).toBe(90);
    expect(characters[0]!.character.className).toBe("Shaman");
  });

  it("falls back to the existing Character row values when no Blizzard snapshot exists", async () => {
    const getAuthoritativeProfile = vi.fn(async () => ({
      source: "NONE" as const,
      fetchedAt: null,
      isStale: false,
      name: "Synblast",
      realm: "Antonidas",
      region: "eu",
      level: 80,
      class: "Shaman",
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null
    }));

    const characters = [characterEntry()];
    await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

    expect(characters[0]!.character.level).toBe(80);
    expect(characters[0]!.character.className).toBe("Shaman");
  });

  it("never touches id/name/realm/region - only className/level are overwritten", async () => {
    const getAuthoritativeProfile = vi.fn(async () => ({
      source: "BLIZZARD" as const,
      fetchedAt: new Date(),
      isStale: false,
      name: "SomeOtherName",
      realm: "SomeOtherRealm",
      region: "us",
      level: 90,
      class: "Mage",
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null
    }));

    const characters = [characterEntry()];
    await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

    // Tracking identity is unaffected even though the (hypothetical)
    // authoritative result carries different name/realm/region values -
    // this function structurally never reads or assigns them.
    expect(characters[0]!.character.id).toBe("char-1");
    expect(characters[0]!.character.name).toBe("Synblast");
    expect(characters[0]!.character.realm).toBe("Antonidas");
    expect(characters[0]!.character.region).toBe("eu");
  });

  it("processes multiple characters independently", async () => {
    const getAuthoritativeProfile = vi.fn(async (characterId: string) => ({
      source: "BLIZZARD" as const,
      fetchedAt: new Date(),
      isStale: false,
      name: characterId,
      realm: "Antonidas",
      region: "eu",
      level: characterId === "char-1" ? 90 : 85,
      class: "Shaman",
      race: null,
      faction: null,
      activeSpec: null,
      guild: null,
      averageItemLevel: null,
      equippedItemLevel: null
    }));

    const characters = [
      characterEntry({ id: "char-1" }),
      characterEntry({ id: "char-2", level: 70 })
    ];
    await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

    expect(characters[0]!.character.level).toBe(90);
    expect(characters[1]!.character.level).toBe(85);
  });

  describe("Phase F2 public profile facts (race/faction/activeSpec/guild/ilvl)", () => {
    it("Blizzard race reaches the effective profile", async () => {
      const getAuthoritativeProfile = vi.fn(async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 90,
        class: "Shaman",
        race: "Dark Iron Dwarf",
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      }));

      const characters = [characterEntry()];
      await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

      expect(characters[0]!.character.race).toBe("Dark Iron Dwarf");
    });

    it("Blizzard faction reaches the effective profile", async () => {
      const getAuthoritativeProfile = vi.fn(async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 90,
        class: "Shaman",
        race: null,
        faction: "ALLIANCE",
        activeSpec: null,
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      }));

      const characters = [characterEntry()];
      await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

      expect(characters[0]!.character.faction).toBe("ALLIANCE");
    });

    it("Blizzard active spec reaches the effective profile", async () => {
      const getAuthoritativeProfile = vi.fn(async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 90,
        class: "Shaman",
        race: null,
        faction: null,
        activeSpec: "Restoration",
        guild: null,
        averageItemLevel: null,
        equippedItemLevel: null
      }));

      const characters = [characterEntry()];
      await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

      expect(characters[0]!.character.activeSpec).toBe("Restoration");
    });

    it("Blizzard guild reaches the effective profile", async () => {
      const getAuthoritativeProfile = vi.fn(async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 90,
        class: "Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: { name: "Before the Storm", realmSlug: "thrall" },
        averageItemLevel: null,
        equippedItemLevel: null
      }));

      const characters = [characterEntry()];
      await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

      expect(characters[0]!.character.guild).toEqual({ name: "Before the Storm", realmSlug: "thrall" });
    });

    it("absence of an optional guild works - stays null, never fabricated", async () => {
      const getAuthoritativeProfile = vi.fn(async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synbeam",
        realm: "Antonidas",
        region: "eu",
        level: 81,
        class: "Druid",
        race: "Tauren",
        faction: "HORDE",
        activeSpec: "Balance",
        guild: null,
        averageItemLevel: 250,
        equippedItemLevel: 250
      }));

      const characters = [characterEntry({ id: "char-unguilded" })];
      await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

      expect(characters[0]!.character.guild).toBeNull();
    });

    it("averageItemLevel and equippedItemLevel remain distinct fields, both reaching the effective profile independently", async () => {
      const getAuthoritativeProfile = vi.fn(async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "Synblast",
        realm: "Antonidas",
        region: "eu",
        level: 90,
        class: "Shaman",
        race: null,
        faction: null,
        activeSpec: null,
        guild: null,
        averageItemLevel: 317.9375,
        equippedItemLevel: 315
      }));

      const characters = [characterEntry()];
      await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

      expect(characters[0]!.character.averageItemLevel).toBe(317.9375);
      expect(characters[0]!.character.equippedItemLevel).toBe(315);
      // Distinct values, not one silently substituted for the other.
      expect(characters[0]!.character.averageItemLevel).not.toBe(
        characters[0]!.character.equippedItemLevel
      );
    });

    it("user/tracking identity (id/name/realm/region) stays untouched even when all new public fields are populated", async () => {
      const getAuthoritativeProfile = vi.fn(async () => ({
        source: "BLIZZARD" as const,
        fetchedAt: new Date(),
        isStale: false,
        name: "SomeOtherName",
        realm: "SomeOtherRealm",
        region: "us",
        level: 90,
        class: "Shaman",
        race: "Dark Iron Dwarf",
        faction: "ALLIANCE",
        activeSpec: "Restoration",
        guild: { name: "Before the Storm", realmSlug: "thrall" },
        averageItemLevel: 317,
        equippedItemLevel: 317
      }));

      const characters = [characterEntry()];
      await applyAuthoritativeProfile(characters, { getAuthoritativeProfile } as never);

      expect(characters[0]!.character.id).toBe("char-1");
      expect(characters[0]!.character.name).toBe("Synblast");
      expect(characters[0]!.character.realm).toBe("Antonidas");
      expect(characters[0]!.character.region).toBe("eu");
    });
  });
});
