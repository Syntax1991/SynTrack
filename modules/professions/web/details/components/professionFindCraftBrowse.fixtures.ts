import type {
  ProfessionRecipeCapability,
  ProfessionRecipeCatalogItem,
  ProfessionRecipeCrafter
} from "../types/professionRecipe.types";

export function createCapability(
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

export function createCrafter(
  overrides: Partial<ProfessionRecipeCrafter>
): ProfessionRecipeCrafter {
  return {
    characterId: "character-1",
    name: "Synblast",
    realm: "Antonidas",
    className: "Shaman",
    level: 80,
    skill: 100,
    skillModifier: 0,
    effectiveSkill: 100,
    knowledgePoints: 0,
    baselineStatus: "UNKNOWN",
    baselineSkillGap: null,
    baselineSkillSurplus: null,
    craftStatus: "SAFE",

    operation: {
      status: "CAPTURED",
      baseSkill: 100,
      bonusSkill: 0,
      effectiveSkill: 100,
      craftingQuality: 5,
      craftingQualityId: 0,
      guaranteedCraftingQualityId:
        null,
      lowerSkillThreshold: 0,
      upperSkillThreshold: 0,
      concentrationCost: null,
      concentrationCurrencyId:
        null,
      ingenuityRefund: null,
      quality: null,
      capturedAt: null,
      captureVersion: null,
      scopeVersion: null
    },

    reagentSimulation: null,

    recommendation: {
      kind: "UNKNOWN",
      craftStatus: "SAFE",
      effectiveSkill: 100,
      craftingQuality: 5,
      concentrationCost: null,
      selections: []
    },

    source: "ADDON",
    lastSyncedAt: null,
    ...overrides
  };
}

export function createRecipe(
  name: string,
  capabilities: ProfessionRecipeCapability[],
  crafters: ProfessionRecipeCrafter[] = [],
  itemQuality: string | null = null
): ProfessionRecipeCatalogItem {
  return {
    id: `recipe-${name}`,
    gameRecipeId: 1,
    name,
    expansion: "THE_WAR_WITHIN",
    categoryId: null,
    craftedItemId: null,
    iconUrl: null,
    itemQuality,
    itemLevel: null,
    baseDifficulty: null,
    craftStatus: "UNKNOWN",
    capabilities,
    crafters,

    operationCoverage: {
      totalCrafterCount: 0,
      capturedCrafterCount: 0,
      missingCrafterCount: 0,
      coveragePercent: 0
    }
  };
}

export function mailWristRecipe(
  name: string,
  crafters: ProfessionRecipeCrafter[],
  itemQuality: string | null = null
) {
  return createRecipe(
    name,
    [
      createCapability({
        name: "Mail",
        type: "EQUIPMENT_FAMILY"
      }),
      createCapability({
        name: "Wrist",
        type: "EQUIPMENT_SLOT",
        slotKey: "WRIST"
      })
    ],
    crafters,
    itemQuality
  );
}

export function leatherWristRecipe(
  name: string,
  crafters: ProfessionRecipeCrafter[]
) {
  return createRecipe(
    name,
    [
      createCapability({
        name: "Leather",
        type: "EQUIPMENT_FAMILY"
      }),
      createCapability({
        name: "Wrist",
        type: "EQUIPMENT_SLOT",
        slotKey: "WRIST"
      })
    ],
    crafters
  );
}
