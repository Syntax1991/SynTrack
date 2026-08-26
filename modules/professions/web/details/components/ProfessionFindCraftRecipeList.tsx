import type {
  ProfessionRecipeCatalogItem
} from "../types/professionRecipe.types";
import { EntityIcon } from "../../shared/components/ProfessionIcons";
import { SynTrackTooltip } from "../../shared/components/SynTrackTooltip";
import { RecipeTooltipContent } from "../../shared/components/ProfessionTooltipContent";
import { getItemQualityColor } from "../utils/professionItemQuality.helpers";
import {
  getInlineCraftResultLabel,
  pickRepresentativeCrafter
} from "../utils/professionInlineCraftResult.helpers";

type ProfessionFindCraftRecipeListProps = {
  recipes: ProfessionRecipeCatalogItem[];
  selectedRecipeId: string | null;
  onSelect: (recipeId: string) => void;
};

export function ProfessionFindCraftRecipeList({
  recipes,
  selectedRecipeId,
  onSelect
}: ProfessionFindCraftRecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className="profession-find-craft-recipe-list">
        <div className="empty-state">
          No recipes match this
          search.
        </div>
      </div>
    );
  }

  return (
    <div className="profession-find-craft-recipe-list">
      {recipes.map(
        (recipe) => {
          const qualityColor =
            getItemQualityColor(
              recipe.itemQuality
            );

          const representativeCrafter =
            pickRepresentativeCrafter(
              recipe
            );

          return (
            <SynTrackTooltip
              className="profession-find-craft-recipe-tooltip-anchor"
              content={
                <RecipeTooltipContent
                  recipe={recipe}
                />
              }
              key={recipe.id}
            >
              <button
                className={
                  selectedRecipeId ===
                  recipe.id
                    ? "profession-find-craft-recipe-option active"
                    : "profession-find-craft-recipe-option"
                }
                onClick={
                  () =>
                    onSelect(
                      recipe.id
                    )
                }
                type="button"
              >
                <span className="profession-find-craft-recipe-option-identity">
                  <EntityIcon
                    iconUrl={
                      recipe.iconUrl
                    }
                    kind="recipe"
                    name={
                      recipe.name
                    }
                    qualityColor={
                      qualityColor
                    }
                  />

                  <strong
                    style={
                      qualityColor
                        ? {
                            color:
                              qualityColor
                          }
                        : undefined
                    }
                  >
                    {recipe.name}
                  </strong>
                </span>

                <span className="profession-find-craft-recipe-option-result">
                  {representativeCrafter && (
                    <strong
                      className={
                        `profession-crafter-craft-cell ${representativeCrafter.craftStatus.toLowerCase()}`
                      }
                    >
                      {
                        getInlineCraftResultLabel(
                          representativeCrafter
                        )
                      }
                    </strong>
                  )}

                  <small>
                    {
                      recipe.crafters
                        .length
                    }
                    {
                      recipe.crafters
                        .length === 1
                        ? " crafter"
                        : " crafters"
                    }
                  </small>
                </span>
              </button>
            </SynTrackTooltip>
          );
        }
      )}
    </div>
  );
}
