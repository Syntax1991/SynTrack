import { describe, expect, it, vi } from "vitest";
import { AddonRecipeCapabilityPersistence } from "./addon-import.recipe.capability.persistence.js";
import type { AddonRecipe } from "./addon-import.types.js";

function createRecipe(
  overrides: Partial<AddonRecipe>
): AddonRecipe {
  return {
    gameRecipeId: 1,
    name: "Test Recipe",
    categoryId: 2291,
    categoryName: null,
    parentCategoryId: null,
    parentCategoryName: null,
    outputItemId: 100,
    outputItemEquipLoc: "INVTYPE_WRIST",
    outputItemClassId: null,
    outputItemSubclassId: null,
    outputItemArmorSubclassKey: null,
    outputItemWeaponSubclassKey: null,
    baseDifficulty: null,
    operationMetrics: {},
    reagentSchema: null,
    reagentSchemaJson: null,
    ...overrides
  };
}

function createTransaction() {
  const capabilitiesByKey =
    new Map<
      string,
      { id: string; name: string }
    >();

  const craftCapability = {
    upsert: vi.fn(
      async (
        args: {
          where: {
            professionId_expansion_key: {
              key: string;
            };
          };
          create: { name: string; type: string };
        }
      ) => {
        const key =
          args.where
            .professionId_expansion_key
            .key;

        const existing =
          capabilitiesByKey.get(
            key
          );

        if (existing) {
          return existing;
        }

        const created = {
          id: `capability-${capabilitiesByKey.size + 1}`,
          name: args.create.name
        };

        capabilitiesByKey.set(
          key,
          created
        );

        return created;
      }
    )
  };

  const craftRecipeCapability = {
    upsert: vi.fn(async () => ({}))
  };

  return {
    transaction: {
      craftCapability,
      craftRecipeCapability
    } as never,
    craftCapability
  };
}

describe("AddonRecipeCapabilityPersistence family resolution", () => {
  it("prefers the exact armor-subclass key over the recipe category name when both are present", async () => {
    const { transaction, craftCapability } =
      createTransaction();

    const persistence =
      new AddonRecipeCapabilityPersistence();

    const recipe =
      createRecipe({
        categoryName: "Leather Armor",
        outputItemArmorSubclassKey: "Mail"
      });

    await persistence.persist(
      transaction,
      "profession-1",
      "THE_WAR_WITHIN",
      2915,
      recipe,
      "recipe-1"
    );

    const familyCalls =
      craftCapability.upsert.mock.calls.filter(
        (call) =>
          call[0].create.name === "Mail" ||
          call[0].create.name === "Leather"
      );

    expect(
      familyCalls.map(
        (call) => call[0].create.name
      )
    ).toEqual(["Mail"]);
  });

  it("falls back to the category-name-derived family when no armor-subclass key was captured", async () => {
    const { transaction, craftCapability } =
      createTransaction();

    const persistence =
      new AddonRecipeCapabilityPersistence();

    const recipe =
      createRecipe({
        categoryName: "Leather Armor",
        outputItemArmorSubclassKey: null
      });

    await persistence.persist(
      transaction,
      "profession-1",
      "THE_WAR_WITHIN",
      2915,
      recipe,
      "recipe-1"
    );

    const familyCalls =
      craftCapability.upsert.mock.calls.filter(
        (call) =>
          call[0].create.name === "Mail" ||
          call[0].create.name === "Leather"
      );

    expect(
      familyCalls.map(
        (call) => call[0].create.name
      )
    ).toEqual(["Leather"]);
  });

  it("produces no family capability when neither source resolves", async () => {
    const { transaction, craftCapability } =
      createTransaction();

    const persistence =
      new AddonRecipeCapabilityPersistence();

    const recipe =
      createRecipe({
        categoryName: "Reagents",
        outputItemArmorSubclassKey: null
      });

    await persistence.persist(
      transaction,
      "profession-1",
      "THE_WAR_WITHIN",
      2915,
      recipe,
      "recipe-1"
    );

    const familyCalls =
      craftCapability.upsert.mock.calls.filter(
        (call) =>
          call[0].create.type ===
          "EQUIPMENT_FAMILY"
      );

    expect(familyCalls).toHaveLength(0);
  });
});

describe("AddonRecipeCapabilityPersistence weapon type resolution", () => {
  it("derives a Sword capability from the Sword2H weapon-subclass key", async () => {
    const { transaction, craftCapability } =
      createTransaction();

    const persistence =
      new AddonRecipeCapabilityPersistence();

    const recipe =
      createRecipe({
        outputItemEquipLoc: "INVTYPE_2HWEAPON",
        outputItemWeaponSubclassKey: "Sword2H"
      });

    await persistence.persist(
      transaction,
      "profession-1",
      "THE_WAR_WITHIN",
      2915,
      recipe,
      "recipe-1"
    );

    const weaponCalls =
      craftCapability.upsert.mock.calls.filter(
        (call) =>
          call[0].create.type ===
          "WEAPON_TYPE"
      );

    expect(
      weaponCalls.map(
        (call) => call[0].create.name
      )
    ).toEqual(["Sword"]);
  });

  it("derives the same Sword capability from Sword1H, since handedness comes from the slot, not the weapon type", async () => {
    const { transaction, craftCapability } =
      createTransaction();

    const persistence =
      new AddonRecipeCapabilityPersistence();

    const recipe =
      createRecipe({
        outputItemEquipLoc: "INVTYPE_WEAPON",
        outputItemWeaponSubclassKey: "Sword1H"
      });

    await persistence.persist(
      transaction,
      "profession-1",
      "THE_WAR_WITHIN",
      2915,
      recipe,
      "recipe-1"
    );

    const weaponCalls =
      craftCapability.upsert.mock.calls.filter(
        (call) =>
          call[0].create.type ===
          "WEAPON_TYPE"
      );

    expect(
      weaponCalls.map(
        (call) => call[0].create.name
      )
    ).toEqual(["Sword"]);
  });

  it("does not confuse an Axe weapon-subclass key with Sword", async () => {
    const { transaction, craftCapability } =
      createTransaction();

    const persistence =
      new AddonRecipeCapabilityPersistence();

    const recipe =
      createRecipe({
        outputItemEquipLoc: "INVTYPE_2HWEAPON",
        outputItemWeaponSubclassKey: "Axe2H"
      });

    await persistence.persist(
      transaction,
      "profession-1",
      "THE_WAR_WITHIN",
      2915,
      recipe,
      "recipe-1"
    );

    const weaponCalls =
      craftCapability.upsert.mock.calls.filter(
        (call) =>
          call[0].create.type ===
          "WEAPON_TYPE"
      );

    expect(
      weaponCalls.map(
        (call) => call[0].create.name
      )
    ).toEqual(["Axe"]);

    expect(
      weaponCalls.some(
        (call) =>
          call[0].create.name === "Sword"
      )
    ).toBe(false);
  });

  it("produces no weapon-type capability for an unresolvable or null weapon-subclass key", async () => {
    const { transaction, craftCapability } =
      createTransaction();

    const persistence =
      new AddonRecipeCapabilityPersistence();

    const recipe =
      createRecipe({
        outputItemWeaponSubclassKey: null
      });

    await persistence.persist(
      transaction,
      "profession-1",
      "THE_WAR_WITHIN",
      2915,
      recipe,
      "recipe-1"
    );

    const weaponCalls =
      craftCapability.upsert.mock.calls.filter(
        (call) =>
          call[0].create.type ===
          "WEAPON_TYPE"
      );

    expect(weaponCalls).toHaveLength(0);
  });
});
