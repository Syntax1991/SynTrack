import type {
  ProfessionRecipeCatalogItem,
  ProfessionRecipeCrafter
} from "../types/professionRecipe.types";
import {
  getProfessionRecipeFamilyName,
  getProfessionRecipeGroupName,
  getProfessionRecipeSlotName
} from "../utils/professionRecipePresentation";

/*
 * The only 4 values EQUIPMENT_FAMILY capabilities can ever resolve to
 * (armor-subclass-key exact match or category-name fallback - see
 * addon-import.recipe-output-capability.ts). Used only to decide
 * whether Browse shows a slot level for a group, never to guess a
 * family for a recipe that has none.
 */
const ARMOR_FAMILY_NAMES = new Set([
  "Cloth",
  "Leather",
  "Mail",
  "Plate"
]);

export type BrowseGroupOption = {
  name: string;
  recipeCount: number;
  isArmorFamily: boolean;
};

export type BrowseSlotOption = {
  slotKey: string;
  slotName: string;
  recipeCount: number;
};

export type BrowseCandidate = {
  characterId: string;
  characterName: string;
  knownRecipeCount: number;
  representativeRecipe: ProfessionRecipeCatalogItem;
  representativeCrafter: ProfessionRecipeCrafter;
};

function getKnownRecipes(
  recipes: ProfessionRecipeCatalogItem[]
): ProfessionRecipeCatalogItem[] {
  return recipes.filter(
    (recipe) =>
      recipe.crafters.length > 0
  );
}

export function computeBrowseGroupOptions(
  recipes: ProfessionRecipeCatalogItem[]
): BrowseGroupOption[] {
  const counts =
    new Map<string, number>();

  for (
    const recipe of
    getKnownRecipes(recipes)
  ) {
    const name =
      getProfessionRecipeGroupName(
        recipe
      );

    counts.set(
      name,
      (counts.get(name) ?? 0) + 1
    );
  }

  return [...counts.entries()]
    .map(
      ([name, recipeCount]) => ({
        name,
        recipeCount,
        isArmorFamily:
          ARMOR_FAMILY_NAMES.has(
            name
          )
      })
    )
    .sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
          "en"
        )
    );
}

export function computeBrowseSlotOptions(
  recipes: ProfessionRecipeCatalogItem[],
  familyName: string
): BrowseSlotOption[] {
  const slots =
    new Map<
      string,
      BrowseSlotOption
    >();

  for (
    const recipe of
    getKnownRecipes(recipes)
  ) {
    if (
      getProfessionRecipeFamilyName(
        recipe
      ) !== familyName
    ) {
      continue;
    }

    const slotName =
      getProfessionRecipeSlotName(
        recipe
      );

    const slotKey =
      recipe.capabilities.find(
        (capability) =>
          capability.type ===
            "EQUIPMENT_SLOT" ||
          capability.slotKey !==
            null
      )?.slotKey;

    if (!slotName || !slotKey) {
      continue;
    }

    const existing =
      slots.get(slotKey);

    if (existing) {
      existing.recipeCount += 1;
      continue;
    }

    slots.set(slotKey, {
      slotKey,
      slotName,
      recipeCount: 1
    });
  }

  return [...slots.values()].sort(
    (left, right) =>
      left.slotName.localeCompare(
        right.slotName,
        "en"
      )
  );
}

export function getRecipesForFamilySlot(
  recipes: ProfessionRecipeCatalogItem[],
  familyName: string,
  slotKey: string
): ProfessionRecipeCatalogItem[] {
  return getKnownRecipes(recipes)
    .filter(
      (recipe) =>
        getProfessionRecipeFamilyName(
          recipe
        ) === familyName &&
        recipe.capabilities.some(
          (capability) =>
            capability.slotKey ===
            slotKey
        )
    )
    .sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
          "en"
        )
    );
}

export function getRecipesForGroup(
  recipes: ProfessionRecipeCatalogItem[],
  groupName: string
): ProfessionRecipeCatalogItem[] {
  return getKnownRecipes(recipes)
    .filter(
      (recipe) =>
        getProfessionRecipeGroupName(
          recipe
        ) === groupName
    )
    .sort(
      (left, right) =>
        left.name.localeCompare(
          right.name,
          "en"
        )
    );
}

/*
 * One candidate row per character who knows at least one recipe in the
 * scoped set. The representative recipe/crafter (used for the compact
 * craft-result shown at this level) is chosen deterministically - the
 * first recipe alphabetically that this character knows - never by
 * quality/specialization ranking. This is a stable pick for
 * compactness, not a "best crafter" judgement; every option remains
 * visible in the recipe list below.
 */
export function computeBrowseCandidates(
  scopedRecipes: ProfessionRecipeCatalogItem[]
): BrowseCandidate[] {
  const candidatesByCharacterId =
    new Map<
      string,
      BrowseCandidate
    >();

  for (
    const recipe of
    scopedRecipes
  ) {
    for (
      const crafter of
      recipe.crafters
    ) {
      const existing =
        candidatesByCharacterId.get(
          crafter.characterId
        );

      if (existing) {
        existing.knownRecipeCount +=
          1;
        continue;
      }

      candidatesByCharacterId.set(
        crafter.characterId,
        {
          characterId:
            crafter.characterId,
          characterName:
            crafter.name,
          knownRecipeCount: 1,
          representativeRecipe:
            recipe,
          representativeCrafter:
            crafter
        }
      );
    }
  }

  return [
    ...candidatesByCharacterId.values()
  ].sort(
    (left, right) =>
      left.characterName.localeCompare(
        right.characterName,
        "en"
      )
  );
}
