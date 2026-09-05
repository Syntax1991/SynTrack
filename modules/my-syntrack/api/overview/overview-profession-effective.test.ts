import { describe, expect, it, vi } from "vitest";
import { applyAuthoritativeProfessionSkill } from "./overview-profession-effective.js";
import type { ProfessionIssuesByCharacter } from "./overview.profession-issues.js";

function issuesMap(): ProfessionIssuesByCharacter {
  return new Map([
    [
      "char-1",
      {
        hasTrackedProfession: true,
        partialIssues: [],
        professions: [
          {
            professionId: "prof-1",
            key: "alchemy",
            name: "Alchemy",
            category: "CRAFTING",
            skill: 90,
            knowledgePoints: 66,
            dataStatus: "TRACKED" as const
          },
          {
            professionId: "prof-2",
            key: "leatherworking",
            name: "Leatherworking",
            category: "CRAFTING",
            skill: 100,
            knowledgePoints: 116,
            dataStatus: "TRACKED" as const
          }
        ]
      }
    ]
  ]);
}

describe("applyAuthoritativeProfessionSkill", () => {
  it("overrides skill with the Blizzard-primary value when available, matched by professionKey", async () => {
    const getAuthoritativeProfessions = vi.fn(async () => [
      { source: "BLIZZARD" as const, professionKey: "alchemy", professionId: 171, professionName: "Alchemy", tierId: 2906, tierName: "Midnight Alchemy", skill: 97, maxSkill: 100, fetchedAt: new Date(), isStale: false }
    ]);

    const map = issuesMap();
    await applyAuthoritativeProfessionSkill(map, { getAuthoritativeProfessions } as never);

    expect(map.get("char-1")!.professions.find((p) => p.key === "alchemy")!.skill).toBe(97);
  });

  it("leaves knowledgePoints and dataStatus completely untouched - the authority result cannot carry them", async () => {
    const getAuthoritativeProfessions = vi.fn(async () => [
      { source: "BLIZZARD" as const, professionKey: "alchemy", professionId: 171, professionName: "Alchemy", tierId: 2906, tierName: "Midnight Alchemy", skill: 97, maxSkill: 100, fetchedAt: new Date(), isStale: false }
    ]);

    const map = issuesMap();
    await applyAuthoritativeProfessionSkill(map, { getAuthoritativeProfessions } as never);

    const alchemy = map.get("char-1")!.professions.find((p) => p.key === "alchemy")!;
    expect(alchemy.knowledgePoints).toBe(66);
    expect(alchemy.dataStatus).toBe("TRACKED");
  });

  it("falls back to the existing addon skill when Blizzard has no matching entry for a profession", async () => {
    const getAuthoritativeProfessions = vi.fn(async () => [
      { source: "ADDON" as const, professionKey: "alchemy", professionId: null, professionName: "Alchemy", tierId: null, tierName: null, skill: 90, maxSkill: null, fetchedAt: null, isStale: false }
    ]);

    const map = issuesMap();
    await applyAuthoritativeProfessionSkill(map, { getAuthoritativeProfessions } as never);

    // leatherworking wasn't in the authority result at all - stays at its
    // original addon-sourced value, untouched.
    expect(map.get("char-1")!.professions.find((p) => p.key === "leatherworking")!.skill).toBe(100);
  });

  it("passes the character's own addon professions (key/name/skill) into the authority lookup", async () => {
    const getAuthoritativeProfessions = vi.fn(async () => []);

    const map = issuesMap();
    await applyAuthoritativeProfessionSkill(map, { getAuthoritativeProfessions } as never);

    expect(getAuthoritativeProfessions).toHaveBeenCalledWith("char-1", [
      { professionKey: "alchemy", professionName: "Alchemy", skill: 90 },
      { professionKey: "leatherworking", professionName: "Leatherworking", skill: 100 }
    ]);
  });
});
