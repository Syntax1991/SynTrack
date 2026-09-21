import { EntityIcon } from "../../shared/components/ProfessionIcons";
import {
  getItemQualityColor,
  getItemQualityLabel
} from "../../details/utils/professionItemQuality.helpers";
import { getPublicCrafterShareCraftLabel } from "../crafterSharePresentation";
import type { PublicCrafterShareRecipe } from "../types/crafterShare.types";

export function PublicCrafterShareTooltip({
  recipe
}: {
  recipe: PublicCrafterShareRecipe;
}) {
  const qualityLabel = getItemQualityLabel(recipe.itemQuality);
  const qualityColor = getItemQualityColor(recipe.itemQuality);
  const hasQualityLine = qualityLabel !== null || recipe.itemLevel !== null;

  return (
    <span className="syntrack-tooltip-body">
      <span className="syntrack-tooltip-item-header">
        <EntityIcon
          iconUrl={recipe.iconUrl}
          kind="recipe"
          name={recipe.name}
          qualityColor={qualityColor}
        />
        <strong
          style={
            qualityColor
              ? {
                  color: qualityColor
                }
              : undefined
          }
        >
          {recipe.name}
        </strong>
      </span>

      {hasQualityLine ? (
        <span>
          {qualityLabel ?? ""}
          {qualityLabel && recipe.itemLevel !== null ? " · " : ""}
          {recipe.itemLevel !== null
            ? `Item Level ${recipe.itemLevel}`
            : ""}
        </span>
      ) : null}

      {recipe.slotName ? <span>{recipe.slotName}</span> : null}

      <span>
        {getPublicCrafterShareCraftLabel(recipe)}
      </span>
      {recipe.craftStatus === "NOT_SAFE" ? (
        <span>Final quality not reached</span>
      ) : null}
    </span>
  );
}
