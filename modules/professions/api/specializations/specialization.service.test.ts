import { describe, expect, it, vi } from "vitest";
import { SpecializationService } from "./specialization.service.js";

function characterRow(skill: number, knowledgePoints = 66) {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    className: "Shaman",
    level: 90,
    professions: [
      {
        id: "assignment-1",
        skill,
        knowledgePoints,
        specializationSummary: null,
        professionId: "prof-1",
        profession: { id: "prof-1", key: "alchemy", name: "Alchemy", category: "CRAFTING" },
        nodeProgress: []
      }
    ]
  };
}

describe("SpecializationService.getCharacterOverview", () => {
  it("displays the Blizzard-authoritative public skill when available", async () => {
    const findCharacter = vi.fn(async () => characterRow(90));
    const findTreesByProfessionIds = vi.fn(async () => []);
    const getAuthoritativeProfessions = vi.fn(async () => [
      { source: "BLIZZARD" as const, professionKey: "alchemy", professionId: 171, professionName: "Alchemy", tierId: 1, tierName: "Tier", skill: 97, maxSkill: 100, fetchedAt: new Date(), isStale: false }
    ]);

    const service = new SpecializationService(
      { findCharacter, findTreesByProfessionIds } as never,
      { getAuthoritativeProfessions } as never
    );

    const result = await service.getCharacterOverview("char-1");

    expect(result.professions[0]!.skill).toBe(97);
  });

  it("falls back to the addon skill when Blizzard has no matching entry", async () => {
    const findCharacter = vi.fn(async () => characterRow(90));
    const findTreesByProfessionIds = vi.fn(async () => []);
    const getAuthoritativeProfessions = vi.fn(async () => []);

    const service = new SpecializationService(
      { findCharacter, findTreesByProfessionIds } as never,
      { getAuthoritativeProfessions } as never
    );

    const result = await service.getCharacterOverview("char-1");

    expect(result.professions[0]!.skill).toBe(90);
  });

  it("leaves knowledgePoints and node progress addon-owned even when the public skill is overridden", async () => {
    const findCharacter = vi.fn(async () => characterRow(90, 66));
    const findTreesByProfessionIds = vi.fn(async () => []);
    const getAuthoritativeProfessions = vi.fn(async () => [
      { source: "BLIZZARD" as const, professionKey: "alchemy", professionId: 171, professionName: "Alchemy", tierId: 1, tierName: "Tier", skill: 97, maxSkill: 100, fetchedAt: new Date(), isStale: false }
    ]);

    const service = new SpecializationService(
      { findCharacter, findTreesByProfessionIds } as never,
      { getAuthoritativeProfessions } as never
    );

    const result = await service.getCharacterOverview("char-1");

    expect(result.professions[0]!.knowledgePoints).toBe(66);
  });

  it("passes the character's own addon professions (key/name/skill) into the authority lookup", async () => {
    const findCharacter = vi.fn(async () => characterRow(90));
    const findTreesByProfessionIds = vi.fn(async () => []);
    const getAuthoritativeProfessions = vi.fn(async () => []);

    const service = new SpecializationService(
      { findCharacter, findTreesByProfessionIds } as never,
      { getAuthoritativeProfessions } as never
    );

    await service.getCharacterOverview("char-1");

    expect(getAuthoritativeProfessions).toHaveBeenCalledWith("char-1", [
      { professionKey: "alchemy", professionName: "Alchemy", skill: 90 }
    ]);
  });
});
