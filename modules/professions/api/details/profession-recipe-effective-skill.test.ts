import { describe, expect, it, vi } from "vitest";
import { resolveEffectivePublicSkillByCharacterId } from "./profession-recipe-effective-skill.js";

describe("resolveEffectivePublicSkillByCharacterId", () => {
  it("uses the Blizzard-authoritative skill when available, matched by professionKey", async () => {
    const getAuthoritativeProfessions = vi.fn(async () => [
      { source: "BLIZZARD" as const, professionKey: "alchemy", professionId: 171, professionName: "Alchemy", tierId: 1, tierName: "Tier", skill: 97, maxSkill: 100, fetchedAt: new Date(), isStale: false }
    ]);

    const map = await resolveEffectivePublicSkillByCharacterId(
      [{ characterId: "char-1", skill: 90 }],
      "alchemy",
      "Alchemy",
      { getAuthoritativeProfessions } as never
    );

    expect(map.get("char-1")).toBe(97);
  });

  it("falls back to the addon skill when Blizzard has no matching entry", async () => {
    const getAuthoritativeProfessions = vi.fn(async () => []);

    const map = await resolveEffectivePublicSkillByCharacterId(
      [{ characterId: "char-1", skill: 90 }],
      "alchemy",
      "Alchemy",
      { getAuthoritativeProfessions } as never
    );

    expect(map.get("char-1")).toBe(90);
  });

  it("resolves each distinct character only once, even when it appears in multiple crafter rows (multiple recipes)", async () => {
    const getAuthoritativeProfessions = vi.fn(async () => [
      { source: "BLIZZARD" as const, professionKey: "alchemy", professionId: 171, professionName: "Alchemy", tierId: 1, tierName: "Tier", skill: 97, maxSkill: 100, fetchedAt: new Date(), isStale: false }
    ]);

    await resolveEffectivePublicSkillByCharacterId(
      [
        { characterId: "char-1", skill: 90 },
        { characterId: "char-1", skill: 90 },
        { characterId: "char-1", skill: 90 }
      ],
      "alchemy",
      "Alchemy",
      { getAuthoritativeProfessions } as never
    );

    expect(getAuthoritativeProfessions).toHaveBeenCalledTimes(1);
  });

  it("resolves multiple distinct characters independently", async () => {
    const getAuthoritativeProfessions = vi.fn(async (characterId: string) => [
      { source: "BLIZZARD" as const, professionKey: "alchemy", professionId: 171, professionName: "Alchemy", tierId: 1, tierName: "Tier", skill: characterId === "char-1" ? 97 : 80, maxSkill: 100, fetchedAt: new Date(), isStale: false }
    ]);

    const map = await resolveEffectivePublicSkillByCharacterId(
      [
        { characterId: "char-1", skill: 90 },
        { characterId: "char-2", skill: 70 }
      ],
      "alchemy",
      "Alchemy",
      { getAuthoritativeProfessions } as never
    );

    expect(map.get("char-1")).toBe(97);
    expect(map.get("char-2")).toBe(80);
  });
});
