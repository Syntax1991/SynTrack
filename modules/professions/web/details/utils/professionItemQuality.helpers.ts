import type { ProfessionRecipeCatalogItem } from "../types/professionRecipe.types";

export type QualityFilterOption =
  | "ALL"
  | "EPIC"
  | "RARE";

/*
 * The exact, closed Blizzard item-quality enum (as returned by the Item
 * Game Data API's quality.type field) - a fixed official set, matched
 * exactly, never guessed from an item name or icon border. Colors are
 * WoW's own official quality colors.
 */
const ITEM_QUALITY_COLORS: Record<string, string> = {
  POOR: "#9d9d9d",
  COMMON: "#ffffff",
  UNCOMMON: "#1eff00",
  RARE: "#0070dd",
  EPIC: "#a335ee",
  LEGENDARY: "#ff8000",
  ARTIFACT: "#e6cc80",
  HEIRLOOM: "#00ccff",
  WOW_TOKEN: "#00ccff"
};

const ITEM_QUALITY_LABELS: Record<string, string> = {
  POOR: "Poor",
  COMMON: "Common",
  UNCOMMON: "Uncommon",
  RARE: "Rare",
  EPIC: "Epic",
  LEGENDARY: "Legendary",
  ARTIFACT: "Artifact",
  HEIRLOOM: "Heirloom",
  WOW_TOKEN: "WoW Token"
};

/*
 * null when SynTrack has no verified quality for this item yet (or the
 * recipe has no crafted output at all) - callers must render the
 * default/neutral color in that case, never a guessed quality color.
 */
export function getItemQualityColor(
  itemQuality: string | null
): string | null {
  if (!itemQuality) {
    return null;
  }

  return (
    ITEM_QUALITY_COLORS[
      itemQuality
    ] ?? null
  );
}

export function getItemQualityLabel(
  itemQuality: string | null
): string | null {
  if (!itemQuality) {
    return null;
  }

  return (
    ITEM_QUALITY_LABELS[
      itemQuality
    ] ?? itemQuality
  );
}

/*
 * The one shared predicate used by Browse, Search, and By Character -
 * no mode implements its own filtering rule. "ALL" always passes.
 * "EPIC"/"RARE" require an EXACT quality match; a recipe with no
 * verified quality (itemQuality === null, e.g. a reagent, or an equipment
 * recipe SynTrack hasn't resolved yet) never passes either filter - it
 * is not assumed to be Rare/Epic, and it is not assumed to be excluded
 * from "ALL".
 */
export function matchesQualityFilter(
  recipe: {
    itemQuality: string | null;
  },
  filter: QualityFilterOption
): boolean {
  if (filter === "ALL") {
    return true;
  }

  return recipe.itemQuality === filter;
}

export function filterRecipesByQuality(
  recipes: ProfessionRecipeCatalogItem[],
  filter: QualityFilterOption
): ProfessionRecipeCatalogItem[] {
  if (filter === "ALL") {
    return recipes;
  }

  return recipes.filter(
    (recipe) =>
      matchesQualityFilter(
        recipe,
        filter
      )
  );
}
