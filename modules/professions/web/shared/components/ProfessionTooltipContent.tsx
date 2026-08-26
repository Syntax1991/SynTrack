import type {
  ProfessionCharacterCoverage,
  ProfessionSpecializationEquipmentClaim
} from "../../details/types/professionDetail.types";
import type { SpecializationNodeGroup } from "../../details/utils/professionSpecializationGrouping";
import { getSpecializationNodeGroupAppliesTo } from "../../details/utils/professionSpecializationGrouping";
import {
  getProfessionRecipeFamilyName,
  getProfessionRecipeSlotName
} from "../../details/utils/professionRecipePresentation";
import {
  getItemQualityColor,
  getItemQualityLabel
} from "../../details/utils/professionItemQuality.helpers";
import {
  getCompactCraftLabel,
  getSpecializationClassName
} from "../../details/components/professionCrafterRecipeTable.helpers";
import {
  getRecipeSpecializationLabel,
  resolveRecipeSpecializationAlignment
} from "../../details/utils/professionRecipeSpecializationAlignment";
import type { ProfessionCrafterRecipeEntry } from "../../details/components/ProfessionCrafterRecipeTable";
import type { ProfessionRecipeCatalogItem } from "../../details/types/professionRecipe.types";
import { EntityIcon } from "./ProfessionIcons";

/*
 * Item info this tooltip shows is limited to fields SynTrack has a
 * VERIFIED source for (real icon, exact Blizzard quality, exact item
 * level, ID-derived family/slot) - nothing here is inferred from the
 * recipe/item name. A field simply doesn't render when SynTrack has no
 * verified value for it, rather than showing a placeholder.
 *
 * crafterEntry is optional context for the By Character view: when
 * provided, the tooltip shows THAT character's specialization
 * alignment and craft result instead of the generic known-crafter
 * count, reusing the exact same alignment/craft-label logic the table
 * row itself uses - no new correctness logic, and no extra data is
 * fetched to populate it (everything here is already loaded for the
 * current view).
 */
export function RecipeTooltipContent({
  recipe,
  crafterEntry,
  specializationEquipment,
  specializationMappingAvailable
}: {
  recipe: ProfessionRecipeCatalogItem;
  crafterEntry?:
    ProfessionCrafterRecipeEntry | null;
  specializationEquipment?:
    ProfessionSpecializationEquipmentClaim[];
  specializationMappingAvailable?: boolean;
}) {
  const family =
    getProfessionRecipeFamilyName(
      recipe
    );

  const slot =
    getProfessionRecipeSlotName(
      recipe
    );

  const subtitle =
    [family, slot]
      .filter(
        (value): value is string =>
          value !== null
      )
      .join(" · ");

  const qualityLabel =
    getItemQualityLabel(
      recipe.itemQuality
    );

  const qualityColor =
    getItemQualityColor(
      recipe.itemQuality
    );

  const alignment =
    crafterEntry &&
    specializationEquipment &&
    specializationMappingAvailable !==
      undefined
      ? resolveRecipeSpecializationAlignment(
          recipe,
          specializationEquipment,
          specializationMappingAvailable
        )
      : null;

  return (
    <span className="syntrack-tooltip-body">
      <span className="syntrack-tooltip-item-header">
        <EntityIcon
          iconUrl={recipe.iconUrl}
          kind="recipe"
          name={recipe.name}
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

      {(qualityLabel ||
        recipe.itemLevel !==
          null) && (
        <span>
          {qualityLabel ?? ""}
          {qualityLabel &&
          recipe.itemLevel !== null
            ? " · "
            : ""}
          {recipe.itemLevel !== null
            ? `Item Level ${recipe.itemLevel}`
            : ""}
        </span>
      )}

      {subtitle && (
        <span>{subtitle}</span>
      )}

      {alignment && crafterEntry ? (
        <>
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

          <span>
            {
              getCompactCraftLabel(
                crafterEntry
              )
            }
          </span>
        </>
      ) : (
        <span>
          {
            recipe.crafters.length >
            0
              ? `${recipe.crafters.length} known crafter${recipe.crafters.length === 1 ? "" : "s"}`
              : "Not known by any captured character"
          }
        </span>
      )}
    </span>
  );
}

export function SpecializationTooltipContent({
  group,
  characterName
}: {
  group: SpecializationNodeGroup;
  characterName: string;
}) {
  return (
    <span className="syntrack-tooltip-body">
      <strong>{group.nodeName}</strong>

      <span>
        {group.rank}
        {
          group.maxRank !== null
            ? `/${group.maxRank}`
            : ""
        }
      </span>

      <span>
        {
          getSpecializationNodeGroupAppliesTo(
            group
          )
        }
      </span>

      <span>{characterName}</span>
    </span>
  );
}

export function CharacterTooltipContent({
  coverage
}: {
  coverage: ProfessionCharacterCoverage;
}) {
  return (
    <span className="syntrack-tooltip-body">
      <strong>
        {coverage.character.name}
      </strong>

      <span>
        {coverage.character.className}
        {" · "}
        {coverage.character.realm}
      </span>

      <span>
        Skill {coverage.skill}
      </span>
    </span>
  );
}
