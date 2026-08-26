import type {
  ProfessionRecipeCatalogItem
} from "../types/professionRecipe.types";
import {
  getProfessionRecipeFamilyName,
  getProfessionRecipeSlotName
} from "../utils/professionRecipePresentation";

/*
 * An empty search defaults to KNOWN recipes only (the ones at least one
 * captured character has learned) rather than dumping the entire
 * catalog - the primary "who should craft this" workflow starts from
 * what is actually usable today. A non-empty query searches every
 * recipe by name, known or not, since the user may be typing the name
 * of something nobody has learned yet.
 */
export function matchesFindCraftQuery(
  recipe: ProfessionRecipeCatalogItem,
  query: string
): boolean {
  const normalized =
    query.trim().toLocaleLowerCase("en");

  if (!normalized) {
    return recipe.crafters.length > 0;
  }

  return recipe.name
    .toLocaleLowerCase("en")
    .includes(normalized);
}

export function getFindCraftRecipeSubtitle(
  recipe: ProfessionRecipeCatalogItem
): string {
  const family =
    getProfessionRecipeFamilyName(
      recipe
    );

  const slot =
    getProfessionRecipeSlotName(
      recipe
    );

  if (family && slot) {
    return `${family} · ${slot}`;
  }

  return family ?? slot ?? "Recipe";
}
