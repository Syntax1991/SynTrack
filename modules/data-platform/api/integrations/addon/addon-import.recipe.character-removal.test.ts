import { describe, expect, it } from "vitest";
import { AddonCharacterRecipePersistence } from "./addon-import.recipe.character.persistence.js";
import { AddonCharacterRecipeOperationPersistence } from "./addon-import.recipe.character-operation.persistence.js";
import {
  character,
  snapshot
} from "./addon-import.gear.persistence.test-helpers.js";

describe("addon import recipe persistence with removed characters", () => {
  it("skips learned recipes when the character row is absent after character persistence", async () => {
    const recipePersistence = new AddonCharacterRecipePersistence();
    const transaction = {
      character: {
        findUnique: async () => null
      },
      characterProfession: {
        findUnique: async () => null
      },
      characterCraftRecipe: {
        findMany: async () => [],
        deleteMany: async () => ({ count: 0 }),
        upsert: async () => ({})
      }
    };

    const addonCharacter = character(null, {
      key: "eu:antonidas:synbanks",
      name: "Synbanks",
      realm: "Antonidas",
      region: "eu",
      professions: [
        {
          professionKey: "blacksmithing",
          name: "Blacksmithing",
          skillLineId: 2822,
          skillLevel: 100,
          maxSkillLevel: 100,
          skillModifier: 0,
          activeExpansionSkillLineId: 2822,
          expansions: [
            {
              skillLineId: 2822,
              displayName: "Midnight Blacksmithing",
              expansionName: "Midnight",
              knowledgeAvailable: 0,
              investedKnowledge: 0,
              progress: [],
              recipeIds: [12345],
              recipeCapturedAt: "2026-08-31T22:53:10.000Z",
              capturedAt: null
            }
          ]
        }
      ]
    });

    await expect(
      recipePersistence.persist(
        transaction as never,
        snapshot([addonCharacter]),
        new Map([["blacksmithing", "prof-blacksmithing"]]),
        new Map([["2822:12345", "recipe-1"]]),
        { catalogs: 0, recipes: 0, learnedRecipes: 0 }
      )
    ).resolves.toBeUndefined();
  });

  it("skips recipe operation captures when the character row is absent after character persistence", async () => {
    const operationPersistence = new AddonCharacterRecipeOperationPersistence();
    const transaction = {
      character: {
        findUnique: async () => null
      },
      characterProfession: {
        findUnique: async () => null
      },
      characterRecipeOperation: {
        upsert: async () => ({})
      }
    };

    const addonCharacter = character(null, {
      key: "eu:antonidas:synbanks",
      name: "Synbanks",
      realm: "Antonidas",
      region: "eu",
      professions: [
        {
          professionKey: "blacksmithing",
          name: "Blacksmithing",
          skillLineId: 2822,
          skillLevel: 100,
          maxSkillLevel: 100,
          skillModifier: 0,
          activeExpansionSkillLineId: 2822,
          expansions: [
            {
              skillLineId: 2822,
              displayName: "Midnight Blacksmithing",
              expansionName: "Midnight",
              knowledgeAvailable: 0,
              investedKnowledge: 0,
              progress: [],
              recipeIds: null,
              recipeCapturedAt: null,
              capturedAt: null
            }
          ]
        }
      ]
    });

    const persisted = await operationPersistence.persist(
      transaction as never,
      {
        ...snapshot([addonCharacter]),
        characterRecipeOperations: [
          {
            characterKey: "eu:antonidas:synbanks",
            skillLineId: 2822,
            captureVersion: 3,
            scopeVersion: 1,
            displayName: "Midnight Blacksmithing",
            expansionName: "Midnight",
            parentSkillLineId: null,
            parentProfessionName: null,
            status: "CAPTURED",
            learnedRecipeCount: 1,
            operationEligibleCount: 1,
            operationRecipeCount: 1,
            capturedAt: "2026-08-31T22:53:10.000Z",
            recipes: [
              {
                gameRecipeId: 12345,
                operationMetrics: {},
                reagentSimulation: null
              }
            ]
          }
        ]
      },
      new Map([["blacksmithing", "prof-blacksmithing"]]),
      new Map([["2822:12345", "recipe-1"]])
    );

    expect(persisted).toBe(0);
  });
});
