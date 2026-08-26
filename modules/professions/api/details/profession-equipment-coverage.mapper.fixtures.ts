import type { mapProfessionEquipmentCoverage } from "./profession-equipment-coverage.mapper.js";

export type Assignment =
  Parameters<
    typeof mapProfessionEquipmentCoverage
  >[0];

export type LearnedRecipe =
  Assignment["recipes"][number];

export type Capability =
  LearnedRecipe["recipe"]["capabilities"][number]["capability"];

let capabilityCounter = 0;
let recipeCounter = 0;

export function createCapability(
  overrides: Partial<Capability>
): Capability {
  capabilityCounter += 1;

  return {
    id: `capability-${capabilityCounter}`,
    key: `test-key-${capabilityCounter}`,
    name: "Unnamed Capability",
    type: "RECIPE_GROUP",
    slotKey: null,
    description: null,
    expansion: "THE_WAR_WITHIN",
    sortOrder: 0,
    ...overrides
  };
}

export function familyCapability(
  name: string
): Capability {
  return createCapability({
    name,
    type: "EQUIPMENT_FAMILY"
  });
}

export function slotCapability(
  slotKey: string,
  name: string
): Capability {
  return createCapability({
    name,
    type: "EQUIPMENT_SLOT",
    slotKey
  });
}

export function weaponTypeCapability(
  name: string
): Capability {
  return createCapability({
    name,
    type: "WEAPON_TYPE"
  });
}

export function createLearnedRecipe(
  capabilities: Capability[]
): LearnedRecipe {
  recipeCounter += 1;

  return {
    source: "ADDON",
    lastSyncedAt: null,

    recipe: {
      id: `recipe-${recipeCounter}`,
      gameRecipeId: recipeCounter,
      skillLineId: 2915,
      expansion: "THE_WAR_WITHIN",
      name: `Test Recipe ${recipeCounter}`,
      categoryId: null,

      capabilities: capabilities.map(
        (capability) => ({
          isPrimary:
            capability.type ===
            "EQUIPMENT_FAMILY",
          capability
        })
      )
    }
  } as LearnedRecipe;
}

export function createAssignment(
  recipes: LearnedRecipe[]
): Assignment {
  return {
    id: "assignment-1",
    skill: 100,
    knowledgePoints: 0,

    character: {
      id: "character-1",
      name: "Synblast",
      realm: "Test Realm",
      className: "Hunter",
      level: 80
    },

    nodeProgress: [],
    recipes
  } as Assignment;
}
