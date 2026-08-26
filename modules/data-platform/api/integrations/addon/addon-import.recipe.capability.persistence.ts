import type {
  AddonImportTransaction
} from "./addon-import.persistence.types.js";
import {
  resolveRecipeEquipmentFamily,
  resolveRecipeEquipmentFamilyFromArmorSubclassKey,
  resolveRecipeOutputSlot,
  resolveRecipeWeaponTypeFromWeaponSubclassKey
} from "./addon-import.recipe-output-capability.js";
import type {
  AddonRecipe
} from "./addon-import.types.js";

type CapabilityDefinition = {
  key: string;
  name: string;
  type: string;
  slotKey: string | null;
  description: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

function createCategoryDescription(
  recipe: AddonRecipe
): string | null {
  if (
    recipe.parentCategoryName &&
    recipe.parentCategoryName !==
      recipe.categoryName
  ) {
    return (
      `${recipe.parentCategoryName} → ${recipe.categoryName}`
    );
  }

  return recipe.categoryName;
}

function createCategoryCapability(
  skillLineId: number,
  recipe: AddonRecipe
): CapabilityDefinition | null {
  if (
    recipe.categoryId === null ||
    !recipe.categoryName
  ) {
    return null;
  }

  return {
    key:
      `addon-category:${skillLineId}:${recipe.categoryId}`,
    name:
      recipe.categoryName,
    type:
      "RECIPE_GROUP",
    slotKey:
      null,
    description:
      createCategoryDescription(
        recipe
      ),
    sortOrder:
      recipe.categoryId,
    isPrimary:
      false
  };
}

function createFamilyCapability(
  skillLineId: number,
  recipe: AddonRecipe
): CapabilityDefinition | null {
  /*
   * Prefer the exact, non-localized armor-subclass-enum-backed source
   * (VERIFIED) whenever the addon captured it. Only fall back to the
   * category-name-derived source (DERIVED) for recipes captured before
   * this field existed, or where the output item exposed no resolvable
   * armor subclass (e.g. a non-armor crafted item).
   */
  const family =
    resolveRecipeEquipmentFamilyFromArmorSubclassKey(
      recipe.outputItemArmorSubclassKey
    ) ??
    resolveRecipeEquipmentFamily(
      recipe.categoryName
    );

  if (!family) {
    return null;
  }

  return {
    key:
      `addon-family:${skillLineId}:${family.key}`,
    name:
      family.name,
    type:
      "EQUIPMENT_FAMILY",
    slotKey:
      null,
    description:
      recipe.categoryName,
    sortOrder:
      10,
    isPrimary:
      true
  };
}

function createWeaponTypeCapability(
  skillLineId: number,
  recipe: AddonRecipe
): CapabilityDefinition | null {
  const weaponType =
    resolveRecipeWeaponTypeFromWeaponSubclassKey(
      recipe.outputItemWeaponSubclassKey
    );

  if (!weaponType) {
    return null;
  }

  return {
    key:
      `addon-weapon-type:${skillLineId}:${weaponType.key}`,
    name:
      weaponType.name,
    type:
      "WEAPON_TYPE",
    slotKey:
      null,
    description:
      recipe.categoryName,
    sortOrder:
      10,
    isPrimary:
      true
  };
}

function createSlotCapability(
  skillLineId: number,
  recipe: AddonRecipe
): CapabilityDefinition | null {
  const slot =
    resolveRecipeOutputSlot(
      recipe.outputItemEquipLoc
    );

  if (!slot) {
    return null;
  }

  return {
    key:
      `addon-slot:${skillLineId}:${slot.key}`,
    name:
      slot.name,
    type:
      "EQUIPMENT_SLOT",
    slotKey:
      slot.key,
    description:
      null,
    sortOrder:
      20,
    isPrimary:
      false
  };
}

export class AddonRecipeCapabilityPersistence {
  async persist(
    transaction:
      AddonImportTransaction,
    professionId: string,
    expansion: string,
    skillLineId: number,
    recipe:
      AddonRecipe,
    craftRecipeId: string
  ): Promise<void> {
    const definitions = [
      createCategoryCapability(
        skillLineId,
        recipe
      ),
      createFamilyCapability(
        skillLineId,
        recipe
      ),
      createWeaponTypeCapability(
        skillLineId,
        recipe
      ),
      createSlotCapability(
        skillLineId,
        recipe
      )
    ].filter(
      (
        definition
      ): definition is
        CapabilityDefinition =>
        definition !== null
    );

    for (
      const definition of
      definitions
    ) {
      await this.persistDefinition(
        transaction,
        professionId,
        expansion,
        craftRecipeId,
        definition
      );
    }
  }

  private async persistDefinition(
    transaction:
      AddonImportTransaction,
    professionId: string,
    expansion: string,
    craftRecipeId: string,
    definition:
      CapabilityDefinition
  ): Promise<void> {
    const capability =
      await transaction
        .craftCapability
        .upsert({
          where: {
            professionId_expansion_key: {
              professionId,
              expansion,
              key:
                definition.key
            }
          },

          create: {
            professionId,
            expansion,
            key:
              definition.key,
            name:
              definition.name,
            type:
              definition.type,
            slotKey:
              definition.slotKey,
            description:
              definition.description,
            sortOrder:
              definition.sortOrder
          },

          update: {
            name:
              definition.name,
            type:
              definition.type,
            slotKey:
              definition.slotKey,
            description:
              definition.description,
            sortOrder:
              definition.sortOrder
          }
        });

    await transaction
      .craftRecipeCapability
      .upsert({
        where: {
          craftRecipeId_capabilityId: {
            craftRecipeId,
            capabilityId:
              capability.id
          }
        },

        create: {
          craftRecipeId,
          capabilityId:
            capability.id,
          isPrimary:
            definition.isPrimary
        },

        update: {
          isPrimary:
            definition.isPrimary
        }
      });
  }
}