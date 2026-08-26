import {
  asNumber,
  asString,
  asTable,
  numericValues,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import {
  normalizeOperationMetrics
} from "./addon-import.operation-metrics.normalizer.js";
import {
  decodeRecipeReagentSchemaValue
} from "./addon-import.recipe-reagent-codec.js";
import {
  normalizeRecipeReagentSchema
} from "./addon-import.recipe-reagent.normalizer.js";
import type {
  AddonRecipe,
  AddonRecipeCatalog,
  LuaValue
} from "./addon-import.types.js";

function optionalPositiveNumber(
  value: LuaValue | undefined
): number | null {
  const number =
    asNumber(
      value
    );

  return (
    number !== null &&
    number > 0
  )
    ? number
    : null;
}

function optionalNonNegativeNumber(
  value: LuaValue | undefined
): number | null {
  const number =
    asNumber(
      value
    );

  return (
    number !== null &&
    number >= 0
  )
    ? number
    : null;
}

function serializeReagentSchema(
  value: LuaValue | undefined
): string | null {
  const schema =
    decodeRecipeReagentSchemaValue(
      value
    );

  if (!schema) {
    return null;
  }

  return JSON.stringify(
    schema
  );
}

function normalizeRecipe(
  value: LuaValue
): AddonRecipe | null {
  const recipe =
    asTable(
      value
    );

  if (!recipe) {
    return null;
  }

  const gameRecipeId =
    asNumber(
      recipe.recipeId
    );

  if (gameRecipeId === null) {
    return null;
  }

  const reagentSchema =
    normalizeRecipeReagentSchema(
      recipe.reagentSchema
    );

  return {
    gameRecipeId,

    name:
      asString(
        recipe.name
      ) ??
      `Recipe ${gameRecipeId}`,

    categoryId:
      optionalPositiveNumber(
        recipe.categoryId
      ),

    categoryName:
      asString(
        recipe.categoryName
      ),

    parentCategoryId:
      optionalPositiveNumber(
        recipe.parentCategoryId
      ),

    parentCategoryName:
      asString(
        recipe.parentCategoryName
      ),

    outputItemId:
      optionalPositiveNumber(
        recipe.outputItemId
      ) ??
      reagentSchema
        ?.outputItemId ??
      null,

    outputItemEquipLoc:
      asString(
        recipe.outputItemEquipLoc
      ),

    outputItemClassId:
      optionalNonNegativeNumber(
        recipe.outputItemClassId
      ),

    outputItemSubclassId:
      optionalNonNegativeNumber(
        recipe.outputItemSubclassId
      ),

    outputItemArmorSubclassKey:
      asString(
        recipe.outputItemArmorSubclassKey
      ),

    outputItemWeaponSubclassKey:
      asString(
        recipe.outputItemWeaponSubclassKey
      ),

    baseDifficulty:
      optionalNonNegativeNumber(
        recipe.baseDifficulty
      ),

    operationMetrics:
      normalizeOperationMetrics(
        recipe.operationMetrics
      ),

    reagentSchema,

    reagentSchemaJson:
      serializeReagentSchema(
        recipe.reagentSchema
      )
  };
}

export function normalizeRecipeCatalog(
  key: string,
  value: LuaValue
): AddonRecipeCatalog | null {
  const catalog =
    asTable(
      value
    );

  if (!catalog) {
    return null;
  }

  const skillLineId =
    asNumber(
      catalog.skillLineId
    ) ??
    Number(
      key
    );

  if (!Number.isFinite(skillLineId)) {
    return null;
  }

  const recipeTable =
    asTable(
      catalog.recipes
    );

  const recipeMap =
    new Map<
      number,
      AddonRecipe
    >();

  for (
    const recipeValue of
    numericValues(
      recipeTable
    )
  ) {
    const recipe =
      normalizeRecipe(
        recipeValue
      );

    if (recipe) {
      recipeMap.set(
        recipe.gameRecipeId,
        recipe
      );
    }
  }

  const recipes =
    [
      ...recipeMap.values()
    ]
      .sort(
        (
          left,
          right
        ) =>
          left.gameRecipeId -
          right.gameRecipeId
      );

  return {
    skillLineId,

    displayName:
      asString(
        catalog.displayName
      ) ??
      `Skill line ${skillLineId}`,

    expansionName:
      asString(
        catalog.expansionName
      ),

    recipes,

    capturedAt:
      unixTimestampToIso(
        catalog.capturedAt
      )
  };
}