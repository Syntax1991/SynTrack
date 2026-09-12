import { describe, expect, it, vi } from "vitest";
import { CharacterProfessionAuthorityService } from "./character-profession-authority.service.js";
import type { AddonProfessionRow } from "./character-profession-authority.service.js";

function createHarness(snapshot: unknown) {
  const findOne = vi.fn(async () => snapshot);
  const service = new CharacterProfessionAuthorityService({ findOne } as never);
  return { service, findOne };
}

const addonAlchemy: AddonProfessionRow = {
  professionKey: "alchemy",
  professionName: "Alchemy",
  skill: 90 // the addon's own, possibly-stale, captured value
};

const freshSnapshot = {
  payload: {
    professions: [
      {
        professionId: 171,
        professionKey: "alchemy",
        professionName: "Alchemie", // localized - never used as the join key
        tierId: 2906,
        tierName: "Midnight Alchemy",
        skill: 97,
        maxSkill: 100
      }
    ]
  },
  fetchedAt: new Date(),
  lastStatus: "SUCCESS" as const,
  lastAttemptAt: new Date(),
  lastError: null
};

describe("CharacterProfessionAuthorityService", () => {
  it("prefers Blizzard's skill/tier/maxSkill when a fresh snapshot covers an addon-tracked profession", async () => {
    const harness = createHarness(freshSnapshot);

    const result = await harness.service.getAuthoritativeProfessions("char-1", [
      addonAlchemy
    ]);

    expect(result).toEqual([
      {
        source: "BLIZZARD",
        professionKey: "alchemy",
        professionId: 171,
        professionName: "Alchemy", // addon's own name used for display consistency
        tierId: 2906,
        tierName: "Midnight Alchemy",
        skill: 97, // Blizzard's fresher value, not the addon's 90
        maxSkill: 100,
        fetchedAt: freshSnapshot.fetchedAt,
        isStale: false
      }
    ]);
  });

  it("never reads or exposes Knowledge Points, specialization nodes, or weekly/Treatise/Treasure state - the input/output shapes structurally cannot carry them", async () => {
    // AddonProfessionRow only has {professionKey, professionName, skill} -
    // there is no knowledgePoints/nodeProgress/weekly field anywhere in
    // this service's types for a caller to even pass in or a bug to leak
    // out through.
    const harness = createHarness(freshSnapshot);
    const result = await harness.service.getAuthoritativeProfessions(
      "char-1",
      [addonAlchemy]
    );

    expect(result[0]).not.toHaveProperty("knowledgePoints");
    expect(result[0]).not.toHaveProperty("nodeProgress");
    expect(result[0]).not.toHaveProperty("weeklyState");
  });

  it("reports (never drops) an addon-tracked profession absent from the current Blizzard snapshot", async () => {
    const harness = createHarness(freshSnapshot);

    const result = await harness.service.getAuthoritativeProfessions("char-1", [
      addonAlchemy,
      { professionKey: "leatherworking", professionName: "Leatherworking", skill: 100 }
    ]);

    const leatherworking = result.find((entry) => entry.professionKey === "leatherworking");

    expect(leatherworking).toEqual({
      source: "ADDON",
      professionKey: "leatherworking",
      professionId: null,
      professionName: "Leatherworking",
      tierId: null,
      tierName: null,
      skill: 100,
      maxSkill: null,
      fetchedAt: null,
      isStale: false
    });
  });

  it("falls back to ADDON entirely when no Blizzard snapshot has ever succeeded", async () => {
    const harness = createHarness(null);

    const result = await harness.service.getAuthoritativeProfessions("char-1", [
      addonAlchemy
    ]);

    expect(result).toEqual([
      {
        source: "ADDON",
        professionKey: "alchemy",
        professionId: null,
        professionName: "Alchemy",
        tierId: null,
        tierName: null,
        skill: 90,
        maxSkill: null,
        fetchedAt: null,
        isStale: false
      }
    ]);
  });

  it("keeps serving the last successful snapshot after a failed refresh attempt", async () => {
    const harness = createHarness({
      ...freshSnapshot,
      lastStatus: "FAILED",
      lastError: "Battle.net 503"
    });

    const result = await harness.service.getAuthoritativeProfessions("char-1", [
      addonAlchemy
    ]);

    expect(result[0]?.skill).toBe(97);
  });

  it("falls back to the addon's skill once stale, but keeps serving the stale tier/maxSkill (no addon equivalent exists)", async () => {
    const staleSnapshot = {
      ...freshSnapshot,
      fetchedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    };
    const harness = createHarness(staleSnapshot);

    const result = await harness.service.getAuthoritativeProfessions("char-1", [
      addonAlchemy
    ]);

    expect(result[0]).toMatchObject({
      isStale: true,
      skill: 90, // addon's real fallback value
      tierId: 2906, // no fallback exists - still the stale Blizzard tier
      maxSkill: 100
    });
  });

  it("surfaces a Blizzard-known profession the addon has no row for at all, when fresh", async () => {
    const harness = createHarness(freshSnapshot);

    const result = await harness.service.getAuthoritativeProfessions("char-1", []);

    expect(result).toEqual([
      expect.objectContaining({ source: "BLIZZARD", professionKey: "alchemy", skill: 97 })
    ]);
  });
});
