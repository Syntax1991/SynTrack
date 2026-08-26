import { describe, expect, it } from "vitest";
import type { ProfessionCrafterRecipeEntry } from "./ProfessionCrafterRecipeTable";
import { getCompactCraftLabel } from "./professionCrafterRecipeTable.helpers";

function createEntry(
  craftStatus:
    ProfessionCrafterRecipeEntry["crafter"]["craftStatus"],
  craftingQuality: number | null,
  concentrationCost: number | null
): ProfessionCrafterRecipeEntry {
  return {
    recipe: {} as ProfessionCrafterRecipeEntry["recipe"],
    group: "Leather",

    crafter: {
      craftStatus,

      recommendation: {
        kind: "UNKNOWN",
        craftStatus,
        effectiveSkill: null,
        craftingQuality,
        concentrationCost,
        selections: []
      }
    } as unknown as ProfessionCrafterRecipeEntry["crafter"]
  };
}

describe("getCompactCraftLabel", () => {
  it("shows just the quality when no Concentration is needed", () => {
    expect(
      getCompactCraftLabel(
        createEntry("SAFE", 5, null)
      )
    ).toBe("Q5");
  });

  it("shows quality plus concentration cost when Concentration is needed", () => {
    expect(
      getCompactCraftLabel(
        createEntry(
          "CONCENTRATION",
          5,
          222
        )
      )
    ).toBe("Q5 · 222 Conc");
  });

  it("shows an unreachable quality distinctly", () => {
    expect(
      getCompactCraftLabel(
        createEntry("NOT_SAFE", 5, null)
      )
    ).toBe("Cannot reach Q5");
  });

  it("falls back to plain status wording when no quality was captured", () => {
    expect(
      getCompactCraftLabel(
        createEntry("SAFE", null, null)
      )
    ).toBe("No Concentration");

    expect(
      getCompactCraftLabel(
        createEntry(
          "CONCENTRATION",
          null,
          null
        )
      )
    ).toBe("Needs Concentration");

    expect(
      getCompactCraftLabel(
        createEntry("NOT_SAFE", null, null)
      )
    ).toBe("Cannot Reach");
  });

  it("shows Unknown when the simulation status is UNKNOWN", () => {
    expect(
      getCompactCraftLabel(
        createEntry("UNKNOWN", null, null)
      )
    ).toBe("Unknown");
  });
});
