import { useState } from "react";
import type {
  ProfessionSpecializationEquipmentClaim
} from "../types/professionDetail.types";
import type {
  ProfessionRecipeCatalogItem,
  ProfessionRecipeCrafter
} from "../types/professionRecipe.types";
import {
  getRecipeSpecializationLabel,
  resolveRecipeSpecializationAlignment
} from "../utils/professionRecipeSpecializationAlignment";
import {
  getProfessionRecipeMaterialRequirementLabel
} from "../utils/professionRecipeRecommendation";
import { ClassIcon } from "../../shared/components/ProfessionIcons";
import type { ProfessionCrafterRecipeEntry } from "./ProfessionCrafterRecipeTable";
import {
  getCompactCraftLabel,
  getResultLabel,
  getSpecializationClassName,
  getStatusLabel
} from "./professionCrafterRecipeTable.helpers";

type ProfessionFindCraftCandidateRowProps = {
  recipe: ProfessionRecipeCatalogItem;
  crafter: ProfessionRecipeCrafter;
  specializationEquipment:
    ProfessionSpecializationEquipmentClaim[];
  specializationMappingAvailable: boolean;
};

export function ProfessionFindCraftCandidateRow({
  recipe,
  crafter,
  specializationEquipment,
  specializationMappingAvailable
}: ProfessionFindCraftCandidateRowProps) {
  const [
    isExpanded,
    setIsExpanded
  ] = useState(false);

  const alignment =
    resolveRecipeSpecializationAlignment(
      recipe,
      specializationEquipment,
      specializationMappingAvailable
    );

  const entry: ProfessionCrafterRecipeEntry = {
    recipe,
    crafter,
    group: ""
  };

  return (
    <div className="profession-crafter-recipe-row-group">
      <button
        className="profession-find-craft-candidate-row"
        onClick={
          () =>
            setIsExpanded(
              !isExpanded
            )
        }
        type="button"
      >
        <span className="profession-find-craft-browse-candidate-identity">
          <ClassIcon
            className={
              crafter.className
            }
          />

          {crafter.name}
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
            `profession-crafter-craft-cell ${crafter.craftStatus.toLowerCase()}`
          }
        >
          {
            getCompactCraftLabel(
              entry
            )
          }
        </span>
      </button>

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
                  crafter.recommendation
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
