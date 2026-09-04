import { describe, expect, it } from "vitest";
import { normalizeBlizzardProfessions } from "./blizzard-professions.normalizer.js";

describe("normalizeBlizzardProfessions", () => {
  it("resolves the current tier by the highest numeric tier id, not array position", () => {
    // Live-verified shape (2026-09-04, real character): Blizzard does
    // NOT guarantee ascending id order - Cooking returned a newer
    // (Cataclysm) tier before an older (Classic) one for a real account.
    const result = normalizeBlizzardProfessions({
      primaries: [
        {
          profession: { id: 171, name: "Alchemy" },
          tiers: [
            { tier: { id: 2906, name: "Midnight Alchemy" }, skill_points: 97, max_skill_points: 100 },
            { tier: { id: 2485, name: "Classic Alchemy" }, skill_points: 1, max_skill_points: 300 }
          ]
        }
      ]
    });

    expect(result.professions[0]).toMatchObject({
      tierId: 2906,
      tierName: "Midnight Alchemy",
      skill: 97,
      maxSkill: 100
    });
  });

  it("picks the highest id even with many historical tiers in arbitrary order (real Fishing-shaped data)", () => {
    const result = normalizeBlizzardProfessions({
      primaries: [
        {
          profession: { id: 171, name: "Alchemy" },
          tiers: [
            { tier: { id: 2485 }, skill_points: 1, max_skill_points: 300 },
            { tier: { id: 2823 }, skill_points: 1, max_skill_points: 100 },
            { tier: { id: 2906 }, skill_points: 100, max_skill_points: 100 },
            { tier: { id: 2871 }, skill_points: 94, max_skill_points: 100 }
          ]
        }
      ]
    });

    expect(result.professions[0]?.tierId).toBe(2906);
    expect(result.professions[0]?.skill).toBe(100);
  });

  it("maps Blizzard's profession id to SynTrack's internal key regardless of the (possibly localized) name", () => {
    const result = normalizeBlizzardProfessions({
      primaries: [
        { profession: { id: 171, name: "Alchemie" }, tiers: [] } // de_DE name
      ]
    });

    expect(result.professions[0]).toMatchObject({
      professionId: 171,
      professionKey: "alchemy", // locale-independent internal key
      professionName: "Alchemie" // localized name kept only as display text
    });
  });

  it("still surfaces a profession Blizzard reports but SynTrack's catalog doesn't map, with a null key", () => {
    const result = normalizeBlizzardProfessions({
      primaries: [{ profession: { id: 999999, name: "Unknown Future Profession" }, tiers: [] }]
    });

    expect(result.professions[0]).toMatchObject({
      professionId: 999999,
      professionKey: null,
      professionName: "Unknown Future Profession"
    });
  });

  it("ignores secondaries (Fishing/Cooking/Archaeology) - out of scope for this domain", () => {
    const result = normalizeBlizzardProfessions({
      primaries: [],
      secondaries: [{ profession: { id: 356, name: "Fishing" }, tiers: [] }]
    });

    expect(result.professions).toEqual([]);
  });

  it("skips a profession entry with no numeric profession id rather than fabricating one", () => {
    const result = normalizeBlizzardProfessions({
      primaries: [{ profession: { name: "Something" }, tiers: [] }]
    });

    expect(result.professions).toEqual([]);
  });

  it("returns null skill/tier for a profession with no tiers at all, never a guessed value", () => {
    const result = normalizeBlizzardProfessions({
      primaries: [{ profession: { id: 171, name: "Alchemy" }, tiers: [] }]
    });

    expect(result.professions[0]).toMatchObject({
      tierId: null,
      tierName: null,
      skill: null,
      maxSkill: null
    });
  });

  it("tolerates a fully empty response without throwing", () => {
    expect(normalizeBlizzardProfessions({})).toEqual({ professions: [] });
  });
});
