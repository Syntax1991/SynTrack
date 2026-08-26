import type { ProfessionRecipeCatalogItem } from "../types/professionRecipe.types";
import type { ProfessionCrafterRecipeEntry } from "./ProfessionCrafterRecipeTable";
import {
  getProfessionRecipeFamilyName,
  getProfessionRecipeSlotName
} from "../utils/professionRecipePresentation";
import { getItemQualityLabel } from "../utils/professionItemQuality.helpers";
import { getProfessionRecipeMaterialRequirementLabel } from "../utils/professionRecipeRecommendation";
import { getResultLabel } from "./professionCrafterRecipeTable.helpers";

/*
 * Browse's candidate list above already shows, once per character: who
 * they are, their relevant specialization node(s), and a compact craft
 * result. Re-showing that same identity/specialization/compact-result
 * trio here when a recipe is clicked was pure duplication (the
 * authenticated-review complaint this component exists to fix). This
 * shows only genuinely ADDITIONAL facts: the recipe's own item quality/
 * level/family-slot, and per-crafter numeric detail (safe materials,
 * full skill+quality result) that isn't visible anywhere else yet. A
 * crafter's plain name is kept only to disambiguate when more than one
 * character knows the recipe - it is not the styled identity row
 * (icon + specialization badge + craft cell) shown above.
 */
export function ProfessionFindCraftRecipeAdditionalDetail({
  recipe
}: {
  recipe: ProfessionRecipeCatalogItem;
}) {
  const qualityLabel =
    getItemQualityLabel(
      recipe.itemQuality
    );

  const family =
    getProfessionRecipeFamilyName(
      recipe
    );

  const slot =
    getProfessionRecipeSlotName(
      recipe
    );

  const familySlot = [
    family,
    slot
  ]
    .filter(
      (value): value is string =>
        value !== null
    )
    .join(" · ");

  const crafters = [
    ...recipe.crafters
  ].sort(
    (left, right) =>
      left.name.localeCompare(
        right.name,
        "en"
      )
  );

  return (
    <div className="profession-find-craft-recipe-additional-detail">
      {(qualityLabel ||
        recipe.itemLevel !== null ||
        familySlot) && (
        <div className="profession-find-craft-recipe-additional-detail-facts">
          {qualityLabel && (
            <span>
              {qualityLabel}
            </span>
          )}

          {recipe.itemLevel !==
            null && (
            <span>
              Item Level{" "}
              {recipe.itemLevel}
            </span>
          )}

          {familySlot && (
            <span>
              {familySlot}
            </span>
          )}
        </div>
      )}

      {crafters.length > 0 && (
        <div className="profession-find-craft-recipe-additional-detail-crafters">
          {crafters.map(
            (crafter) => {
              const entry: ProfessionCrafterRecipeEntry =
                {
                  recipe,
                  crafter,
                  group: ""
                };

              return (
                <div
                  className="profession-find-craft-recipe-additional-detail-crafter"
                  key={
                    crafter.characterId
                  }
                >
                  <span className="profession-find-craft-recipe-additional-detail-crafter-name">
                    {
                      crafter.name
                    }
                  </span>

                  <span>
                    {
                      getProfessionRecipeMaterialRequirementLabel(
                        crafter.recommendation
                      )
                    }
                  </span>

                  <span>
                    {
                      getResultLabel(
                        entry
                      )
                    }
                  </span>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
