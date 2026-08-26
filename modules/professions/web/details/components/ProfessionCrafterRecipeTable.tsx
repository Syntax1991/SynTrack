import { useState } from "react";
import type {
  ProfessionRecipeCatalogItem,
  ProfessionRecipeCrafter
} from "../types/professionRecipe.types";
import type {
  ProfessionSpecializationEquipmentClaim
} from "../types/professionDetail.types";
import { EntityIcon } from "../../shared/components/ProfessionIcons";
import { SynTrackTooltip } from "../../shared/components/SynTrackTooltip";
import { RecipeTooltipContent } from "../../shared/components/ProfessionTooltipContent";
import { getItemQualityColor } from "../utils/professionItemQuality.helpers";
import {
  getProfessionRecipeMaterialRequirementLabel
} from "../utils/professionRecipeRecommendation";
import {
  getProfessionRecipeProductLabel
} from "../utils/professionRecipePresentation";
import {
  getRecipeSpecializationLabel,
  resolveRecipeSpecializationAlignment
} from "../utils/professionRecipeSpecializationAlignment";
import {
  getCompactCraftLabel,
  getResultLabel,
  getSpecializationClassName,
  getStatusLabel,
  sortEntries
} from "./professionCrafterRecipeTable.helpers";

export type ProfessionCrafterRecipeEntry = {
  recipe:
    ProfessionRecipeCatalogItem;
  crafter:
    ProfessionRecipeCrafter;
  group: string;
};

export function ProfessionCrafterRecipeTable({
  entries,
  specializationEquipment,
  specializationMappingAvailable
}: {
  entries:
    ProfessionCrafterRecipeEntry[];
  specializationEquipment:
    ProfessionSpecializationEquipmentClaim[];
  specializationMappingAvailable: boolean;
}) {
  const [
    expandedRecipeId,
    setExpandedRecipeId
  ] =
    useState<string | null>(
      null
    );

  if (entries.length === 0) {
    return (
      <section className="panel">
        <div className="empty-state">
          No recipes match this
          filter.
        </div>
      </section>
    );
  }

  const sortedEntries =
    sortEntries(
      entries
    );

  return (
    <section className="panel profession-crafter-recipe-panel">
      <div className="profession-crafter-recipe-table-header">
        <span>Recipe</span>
        <span>Type</span>
        <span>Specialization</span>
        <span>Craft</span>
      </div>

      <div className="profession-crafter-recipe-rows">
        {sortedEntries.map(
          (entry) => {
            const alignment =
              resolveRecipeSpecializationAlignment(
                entry.recipe,
                specializationEquipment,
                specializationMappingAvailable
              );

            const isExpanded =
              expandedRecipeId ===
              entry.recipe.id;

            const qualityColor =
              getItemQualityColor(
                entry.recipe
                  .itemQuality
              );

            return (
              <div
                className="profession-crafter-recipe-row-group"
                key={
                  entry.recipe.id
                }
              >
                <SynTrackTooltip
                  className="profession-crafter-recipe-tooltip-anchor"
                  content={
                    <RecipeTooltipContent
                      crafterEntry={
                        entry
                      }
                      recipe={
                        entry.recipe
                      }
                      specializationEquipment={
                        specializationEquipment
                      }
                      specializationMappingAvailable={
                        specializationMappingAvailable
                      }
                    />
                  }
                >
                <button
                  className="profession-crafter-recipe-row"
                  onClick={
                    () =>
                      setExpandedRecipeId(
                        isExpanded
                          ? null
                          : entry.recipe.id
                      )
                  }
                  type="button"
                >
                  <span className="profession-crafter-recipe-name">
                    <EntityIcon
                      iconUrl={
                        entry.recipe
                          .iconUrl
                      }
                      kind="recipe"
                      name={
                        entry.recipe
                          .name
                      }
                      qualityColor={
                        qualityColor
                      }
                    />

                    <span
                      style={
                        qualityColor
                          ? {
                              color:
                                qualityColor
                            }
                          : undefined
                      }
                    >
                      {
                        entry.recipe
                          .name
                      }
                    </span>
                  </span>

                  <span className="profession-crafter-product-type">
                    {
                      getProfessionRecipeProductLabel(
                        entry.recipe
                      )
                    }
                  </span>

                  <span
                    className={
                      getSpecializationClassName(
                        alignment.state
                      )
                    }
                  >
                    {
                      getRecipeSpecializationLabel(
                        alignment
                      )
                    }
                  </span>

                  <span
                    className={
                      `profession-crafter-craft-cell ${entry.crafter.craftStatus.toLowerCase()}`
                    }
                  >
                    {
                      getCompactCraftLabel(
                        entry
                      )
                    }
                  </span>
                </button>
                </SynTrackTooltip>

                {isExpanded && (
                  <div className="profession-crafter-recipe-detail">
                    <div>
                      <span>
                        Craft result
                      </span>

                      <strong>
                        {
                          getStatusLabel(
                            entry
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Safe materials
                      </span>

                      <strong>
                        {
                          getProfessionRecipeMaterialRequirementLabel(
                            entry.crafter
                              .recommendation
                          )
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Result
                      </span>

                      <strong>
                        {
                          getResultLabel(
                            entry
                          )
                        }
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}
