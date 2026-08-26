import { useState } from "react";
import type { ProfessionRecipeCatalogItem } from "../types/professionRecipe.types";
import { ProfessionFindCraftRecipeAdditionalDetail } from "./ProfessionFindCraftRecipeAdditionalDetail";
import { ProfessionFindCraftRecipeList } from "./ProfessionFindCraftRecipeList";

type ProfessionFindCraftScopedRecipesProps = {
  recipes: ProfessionRecipeCatalogItem[];
};

/*
 * Browse's candidate list (shown above, outside this component) already
 * displays each known character once with their specialization and a
 * compact craft result - clicking a recipe here must not repeat that.
 * See ProfessionFindCraftRecipeAdditionalDetail for exactly what is (and
 * isn't) shown when a recipe is selected.
 */
export function ProfessionFindCraftScopedRecipes({
  recipes
}: ProfessionFindCraftScopedRecipesProps) {
  const [
    selectedRecipeId,
    setSelectedRecipeId
  ] =
    useState<string | null>(
      null
    );

  const selectedRecipe =
    recipes.find(
      (recipe) =>
        recipe.id ===
        selectedRecipeId
    ) ?? null;

  return (
    <>
      <ProfessionFindCraftRecipeList
        onSelect={
          setSelectedRecipeId
        }
        recipes={recipes}
        selectedRecipeId={
          selectedRecipeId
        }
      />

      {selectedRecipe && (
        <ProfessionFindCraftRecipeAdditionalDetail
          recipe={
            selectedRecipe
          }
        />
      )}
    </>
  );
}
