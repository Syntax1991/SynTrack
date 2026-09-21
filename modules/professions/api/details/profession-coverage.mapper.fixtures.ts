import type { mapProfessionCharacterCoverage } from "./profession-coverage.mapper.js";

export type Assignment =
  Parameters<
    typeof mapProfessionCharacterCoverage
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
  options: {
    recipes?: LearnedRecipe[];
    nodeProgressCount?: number;
  } = {}
): Assignment {
  const nodeProgress =
    Array.from(
      {
        length:
          options.nodeProgressCount ??
          0
      },
      (
        _,
        index
      ) => ({
        rank: 1,
        knowledgeRank: 1,

        node: {
          key:
            `addon:unmapped-${index}`,
          name: "Test Node",
          maxRank: 21,
          knowledgeMaxRank: 20
        }
      })
    );

  return {
    id: "assignment-1",
    skill: 100,
    knowledgePoints: 5,

    character: {
      id: "character-1",
      name: "Synblast",
      realm: "Test Realm",
      region: "eu",
      className: "Hunter",
      level: 80
    },

    nodeProgress,
    recipes:
      options.recipes ?? []
  } as Assignment;
}
