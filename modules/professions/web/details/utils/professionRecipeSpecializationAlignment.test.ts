import { describe, expect, it } from "vitest";
import type {
  ProfessionRecipeCapability,
  ProfessionRecipeCatalogItem
} from "../types/professionRecipe.types";
import type {
  ProfessionSpecializationEquipmentClaim
} from "../types/professionDetail.types";
import {
  getRecipeSpecializationLabel,
  resolveRecipeSpecializationAlignment
} from "./professionRecipeSpecializationAlignment";

function createCapability(
  overrides: Partial<ProfessionRecipeCapability>
): ProfessionRecipeCapability {
  return {
    id: "capability-1",
    key: "test-key",
    name: "Unnamed",
    type: "RECIPE_GROUP",
    slotKey: null,
    description: null,
    isPrimary: false,
    ...overrides
  };
}

function createRecipe(
  capabilities: ProfessionRecipeCapability[]
): ProfessionRecipeCatalogItem {
  return {
    id: "recipe-1",
    gameRecipeId: 1,
    name: "Scout's Scaled Bracers",
    expansion: "THE_WAR_WITHIN",
    categoryId: null,
    craftedItemId: null,
    iconUrl: null,
    itemQuality: null,
    itemLevel: null,
    baseDifficulty: null,
    craftStatus: "CONCENTRATION",
    capabilities,
    crafters: [],

    operationCoverage: {
      totalCrafterCount: 0,
      capturedCrafterCount: 0,
      missingCrafterCount: 0,
      coveragePercent: 0
    }
  };
}

function createClaim(
  overrides: Partial<ProfessionSpecializationEquipmentClaim>
): ProfessionSpecializationEquipmentClaim {
  const familyName =
    overrides.familyName ?? "Leather";
  const slotKey =
    overrides.slotKey ?? "WRIST";

  return {
    id: "claim-1",
    provenance: "CURATED_VERIFIED",
    kind: "EQUIPMENT_SLOT",
    capabilityKey: `${familyName}:${slotKey}`,
    presentationGroup: familyName,
    familyName,
    slotKey,
    slotName: "Wrist",
    rank: 15,
    maxRank: 20,
    nodeName: "Wonderful Wristguards",
    nodeKey: "addon:107884",
    nodeIconUrl: null,
    ...overrides
  };
}

const mailWristRecipe =
  createRecipe([
    createCapability({
      name: "Mail",
      type: "EQUIPMENT_FAMILY"
    }),
    createCapability({
      name: "Wrist",
      type: "EQUIPMENT_SLOT",
      slotKey: "WRIST"
    })
  ]);

describe("resolveRecipeSpecializationAlignment", () => {
  it("is SPECIALIZED when a matching family+slot claim exists", () => {
    const leatherWristRecipe =
      createRecipe([
        createCapability({
          name: "Leather",
          type: "EQUIPMENT_FAMILY"
        }),
        createCapability({
          name: "Wrist",
          type: "EQUIPMENT_SLOT",
          slotKey: "WRIST"
        })
      ]);

    const alignment =
      resolveRecipeSpecializationAlignment(
        leatherWristRecipe,
        [createClaim({})],
        true
      );

    expect(alignment).toEqual({
      state: "SPECIALIZED",
      rank: 15,
      maxRank: 20,
      nodeName: "Wonderful Wristguards"
    });

    expect(
      getRecipeSpecializationLabel(
        alignment
      )
    ).toBe("Wonderful Wristguards 15/20");
  });

  it("is NOT_SPECIALIZED for a known Mail Wrist recipe when the character's investment is Leather Wrist - the Synblast acceptance case", () => {
    const alignment =
      resolveRecipeSpecializationAlignment(
        mailWristRecipe,
        [
          createClaim({
            familyName: "Leather"
          })
        ],
        true
      );

    expect(alignment).toEqual({
      state: "NOT_SPECIALIZED"
    });

    expect(
      getRecipeSpecializationLabel(
        alignment
      )
    ).toBe("Not specialized");
  });

  it("is UNKNOWN when the profession has no specialization-equipment mapping, even with matching claims", () => {
    const alignment =
      resolveRecipeSpecializationAlignment(
        mailWristRecipe,
        [
          createClaim({
            familyName: "Mail"
          })
        ],
        false
      );

    expect(alignment).toEqual({
      state: "UNKNOWN"
    });
  });

  it("is NOT_APPLICABLE (not UNKNOWN) when the recipe itself has no proven family/slot capability, e.g. a reagent", () => {
    const recipeWithoutEquipmentCapability =
      createRecipe([
        createCapability({
          name: "Reagents",
          type: "RECIPE_GROUP"
        })
      ]);

    const alignment =
      resolveRecipeSpecializationAlignment(
        recipeWithoutEquipmentCapability,
        [createClaim({})],
        true
      );

    expect(alignment).toEqual({
      state: "NOT_APPLICABLE"
    });

    expect(
      getRecipeSpecializationLabel(
        alignment
      )
    ).toBe("—");
  });

  it("is NOT_APPLICABLE even when the profession has no mapping at all, for a non-equipment recipe", () => {
    const recipeWithoutEquipmentCapability =
      createRecipe([
        createCapability({
          name: "Profession Equipment",
          type: "RECIPE_GROUP"
        })
      ]);

    const alignment =
      resolveRecipeSpecializationAlignment(
        recipeWithoutEquipmentCapability,
        [],
        false
      );

    expect(alignment).toEqual({
      state: "NOT_APPLICABLE"
    });
  });

  it("is independent of the recipe's craft-simulation status", () => {
    const safeVariant =
      { ...mailWristRecipe, craftStatus: "SAFE" as const };

    const notSafeVariant =
      { ...mailWristRecipe, craftStatus: "NOT_SAFE" as const };

    const claims =
      [createClaim({ familyName: "Mail" })];

    expect(
      resolveRecipeSpecializationAlignment(
        safeVariant,
        claims,
        true
      )
    ).toEqual(
      resolveRecipeSpecializationAlignment(
        notSafeVariant,
        claims,
        true
      )
    );
  });
});
