import { describe, expect, it } from "vitest";
import { mapPublicCrafterShareCard } from "./crafter-share.mapper.js";
import type {
  CrafterShareCharacterRecord,
  CrafterShareRecipeRecord
} from "./crafter-share.types.js";

type RecipeSetup = Partial<
  Omit<CrafterShareRecipeRecord, "recipe">
> & {
  name: string;
  baseDifficulty?: number | null;
  itemQuality?: string | null;
  itemLevel?: number | null;
  iconUrl?: string | null;
  slotName?: string | null;
  slotKey?: string | null;
  capabilityType?: string;
};

function capturedRecipe(setup: RecipeSetup): CrafterShareRecipeRecord {
  const {
    name,
    baseDifficulty,
    itemQuality,
    itemLevel,
    iconUrl,
    slotName,
    slotKey,
    capabilityType,
    ...record
  } = setup;

  const type = capabilityType ?? "EQUIPMENT_SLOT";
  const resolvedSlotKey =
    slotKey === undefined
      ? type === "EQUIPMENT_SLOT"
        ? "WRIST"
        : null
      : slotKey;

  return {
    learned: true,
    baseSkill: 80,
    bonusSkill: 0,
    effectiveSkill: 80,
    craftingQuality: 5,
    craftingQualityId: 5,
    guaranteedCraftingQualityId: 5,
    lowerSkillThreshold: 40,
    upperSkillThreshold: 80,
    concentrationCost: 0,
    concentrationCurrencyId: null,
    ingenuityRefund: null,
    quality: 1,
    operationMetricsJson: "{}",
    operationCapturedAt: new Date("2026-09-01T00:00:00.000Z"),
    operationCaptureVersion: 3,
    operationScopeVersion: 1,
    reagentSimulationJson: null,
    ...record,
    recipe: {
      name,
      itemQuality: itemQuality ?? "EPIC",
      itemLevel: itemLevel ?? null,
      iconUrl: iconUrl ?? null,
      baseDifficulty: baseDifficulty ?? 80,
      capabilities: [
        {
          isPrimary: true,
          capability: {
            name: slotName ?? "Wrist",
            type,
            slotKey: resolvedSlotKey
          }
        }
      ]
    }
  };
}

function character(
  recipes: CrafterShareRecipeRecord[]
): CrafterShareCharacterRecord {
  return {
    name: "Synblast",
    realm: "Antonidas",
    className: "Shaman",
    professions: [
      {
        profession: { name: "Blacksmithing" },
        recipes
      }
    ]
  };
}

function cardOf(recipes: CrafterShareRecipeRecord[]) {
  return mapPublicCrafterShareCard({
    battleTag: "Syn#1234",
    characters: [character(recipes)]
  });
}

function recipesOf(recipes: CrafterShareRecipeRecord[]) {
  return cardOf(recipes).characters[0]?.professions[0]?.recipes;
}

function simOp(skill: number, quality: number, conc = 0) {
  return {
    baseSkill: skill,
    bonusSkill: 0,
    craftingQuality: quality,
    craftingQualityID: quality,
    guaranteedCraftingQualityID: quality,
    lowerSkillThreshold: Math.max(0, skill - 40),
    upperSkillThreshold: skill,
    concentrationCost: conc
  };
}

function capturedSimulation(
  highest: ReturnType<typeof simOp>,
  concentrated?: ReturnType<typeof simOp>
): string {
  return JSON.stringify({
    captureVersion: 1,
    status: "CAPTURED",
    requiredModifiedSlotCount: 1,
    simulatedSlotCount: 1,
    qualitySlotCount: 1,
    concentrationCaptured: concentrated !== undefined,
    lowestQualityOperation: simOp(20, 3),
    highestQualityOperation: highest,
    highestQualityConcentrationOperation: concentrated ?? {}
  });
}

function notSafeCapture(name: string, simulation: string) {
  return capturedRecipe({
    name,
    slotName: "One-Hand Weapon",
    slotKey: "ONE_HAND",
    craftingQuality: 3,
    effectiveSkill: 20,
    upperSkillThreshold: 40,
    concentrationCost: 0,
    baseDifficulty: 80,
    reagentSimulationJson: simulation
  });
}

describe("mapPublicCrafterShareCard", () => {
  it("keeps safe crafts and omits private skill fields", () => {
    const card = cardOf([
      capturedRecipe({
        name: "Scout's Scaled Bracers",
        slotName: "Mail Wrist",
        itemLevel: 331,
        iconUrl: "https://example.test/bracers.png"
      })
    ]);

    expect(recipesOf([
      capturedRecipe({
        name: "Scout's Scaled Bracers",
        slotName: "Mail Wrist",
        itemLevel: 331,
        iconUrl: "https://example.test/bracers.png"
      })
    ])).toEqual([
      {
        name: "Scout's Scaled Bracers",
        itemQuality: "EPIC",
        itemLevel: 331,
        iconUrl: "https://example.test/bracers.png",
        resultQuality: 5,
        craftStatus: "SAFE",
        slotName: "Mail Wrist"
      }
    ]);
    expect(JSON.stringify(card)).not.toMatch(/concentrationCost/u);
    expect(JSON.stringify(card)).not.toMatch(/skillModifier/u);
    expect(JSON.stringify(card)).not.toMatch(/knowledgePoints/u);
  });

  it("omits reagents and bolts that have no player-gear EQUIPMENT_SLOT", () => {
    expect(
      recipesOf([
        capturedRecipe({
          name: "Sunfire Silk Bolt",
          capabilityType: "PRODUCT_CATEGORY",
          slotName: "Optional Reagents",
          slotKey: null
        }),
        capturedRecipe({
          name: "Scout's Scaled Bracers",
          slotName: "Wrist"
        })
      ])?.map((recipe) => recipe.name)
    ).toEqual(["Scout's Scaled Bracers"]);
  });

  it("omits unlearned recipes, keeps not-safe crafts on the card", () => {
    const recipes = recipesOf([
      capturedRecipe({ name: "Hidden", learned: false }),
      capturedRecipe({
        name: "Cannot Reach",
        effectiveSkill: 20,
        upperSkillThreshold: 40,
        concentrationCost: 0,
        baseDifficulty: 80
      }),
      capturedRecipe({
        name: "Unproven",
        operationMetricsJson: null,
        operationCaptureVersion: null,
        operationScopeVersion: null
      }),
      capturedRecipe({
        name: "Needs Conc",
        effectiveSkill: 50,
        upperSkillThreshold: 80,
        concentrationCost: 120,
        baseDifficulty: 80,
        craftingQuality: 4
      })
    ]);

    expect(recipes?.map((recipe) => recipe.name)).toEqual([
      "Cannot Reach",
      "Needs Conc",
      "Unproven"
    ]);
    expect(recipes?.map((recipe) => recipe.craftStatus)).toEqual([
      "NOT_SAFE",
      "CONCENTRATION",
      "UNKNOWN"
    ]);
  });

  it("drops characters that only have gathering or empty professions", () => {
    expect(
      mapPublicCrafterShareCard({
        battleTag: "Syn#1234",
        characters: [
          {
            name: "Herbalist",
            realm: "Antonidas",
            className: "Druid",
            professions: []
          }
        ]
      }).characters
    ).toEqual([]);
  });

  it("uses Find Craft recommendation quality, not the last capture", () => {
    const recipes = recipesOf([
      notSafeCapture(
        "Magister's Cleaver",
        capturedSimulation(simOp(446, 5))
      ),
      notSafeCapture(
        "Farstrider's Chopper",
        capturedSimulation(simOp(50, 3), simOp(446, 5, 594))
      )
    ]);

    expect(
      recipes?.map((recipe) => [
        recipe.name,
        recipe.resultQuality,
        recipe.craftStatus
      ])
    ).toEqual([
      ["Farstrider's Chopper", 5, "CONCENTRATION"],
      ["Magister's Cleaver", 5, "SAFE"]
    ]);
    expect(JSON.stringify(recipes)).not.toMatch(/594/u);
  });
});
