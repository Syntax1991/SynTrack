import { describe, expect, it } from "vitest";
import { normalizeBlizzardProfile } from "./blizzard-profile.normalizer.js";

const context = { requestedName: "Synblast", requestedRealm: "Antonidas" };

describe("normalizeBlizzardProfile", () => {
  it("maps class/race/faction/spec/guild/item-level fields", () => {
    const result = normalizeBlizzardProfile(
      {
        name: "Synblast",
        realm: { name: "Antonidas", slug: "antonidas" },
        level: 90,
        character_class: { id: 7, name: "Schamane" },
        race: { id: 34, name: "Dunkeleisenzwerg" },
        faction: { type: "ALLIANCE", name: "Allianz" },
        active_spec: { id: 264, name: "Wiederherstellung" },
        guild: { name: "Before the Storm", realm: { slug: "thrall" } },
        average_item_level: 317,
        equipped_item_level: 317
      },
      context
    );

    expect(result).toMatchObject({
      level: 90,
      classId: 7,
      className: "Shaman", // canonical English, not the localized "Schamane"
      raceId: 34,
      raceName: "Dunkeleisenzwerg", // Blizzard's localized name, kept as-is
      faction: "ALLIANCE", // the stable type, not the localized "Allianz"
      activeSpecId: 264,
      activeSpecName: "Wiederherstellung",
      guildName: "Before the Storm",
      guildRealmSlug: "thrall",
      averageItemLevel: 317,
      equippedItemLevel: 317,
      identityMismatch: false
    });
  });

  it("captures the raw last_login_timestamp for cross-domain recency comparisons", () => {
    const result = normalizeBlizzardProfile(
      { name: "Synbeast", realm: { name: "Antonidas" }, last_login_timestamp: 1788481543000 },
      { requestedName: "Synbeast", requestedRealm: "Antonidas" }
    );

    expect(result.lastLoginTimestamp).toBe(1788481543000);
  });

  it("uses the canonical English class name regardless of the configured API locale", () => {
    const result = normalizeBlizzardProfile(
      { character_class: { id: 12, name: "Demonenjäger" } },
      context
    );

    expect(result.className).toBe("Demon Hunter");
  });

  it("represents an absent guild as null, not a thrown error or a fabricated value", () => {
    const result = normalizeBlizzardProfile(
      { name: "Synblast", realm: { name: "Antonidas" }, level: 90 },
      context
    );

    expect(result.guildName).toBeNull();
    expect(result.guildRealmSlug).toBeNull();
  });

  it("does not flag a mismatch for casing-only differences", () => {
    const result = normalizeBlizzardProfile(
      { name: "synblast", realm: { name: "antonidas" } },
      context
    );

    expect(result.identityMismatch).toBe(false);
  });

  it("flags a real name/realm mismatch without correcting or guessing anything", () => {
    const result = normalizeBlizzardProfile(
      { name: "SomeoneElse", realm: { name: "Antonidas" } },
      context
    );

    expect(result.identityMismatch).toBe(true);
    expect(result.reportedName).toBe("SomeoneElse");
  });

  it("returns null classId/className for an unknown Blizzard class id, never a guess", () => {
    const result = normalizeBlizzardProfile(
      { character_class: { id: 999, name: "???" } },
      context
    );

    expect(result.classId).toBe(999);
    expect(result.className).toBeNull();
  });

  it("tolerates a fully empty response without throwing", () => {
    const result = normalizeBlizzardProfile({}, context);

    expect(result).toMatchObject({
      reportedName: null,
      level: null,
      classId: null,
      className: null,
      raceId: null,
      faction: null,
      guildName: null,
      averageItemLevel: null,
      equippedItemLevel: null,
      lastLoginTimestamp: null,
      identityMismatch: false
    });
  });
});
