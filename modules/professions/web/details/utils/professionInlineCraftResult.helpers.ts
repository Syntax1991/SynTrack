import type {
  ProfessionRecipeCatalogItem,
  ProfessionRecipeCrafter
} from "../types/professionRecipe.types";

/*
 * The single most useful known crafter to summarize a recipe row by,
 * when the row itself isn't scoped to one selected character (Browse's
 * Recipes list, Search results). Recipe.crafters arrives already sorted
 * by the backend (profession-recipe.mapper.ts's compareCrafters: best
 * craft status, then lowest concentration cost, then highest skill) -
 * the exact same sort recipe.craftStatus itself is derived from. Taking
 * the first entry reuses that existing computation; it does not invent
 * a new "best crafter" ranking algorithm.
 */
export function pickRepresentativeCrafter(
  recipe: ProfessionRecipeCatalogItem
): ProfessionRecipeCrafter | null {
  return recipe.crafters[0] ?? null;
}

/*
 * A compact "what will this actually produce" summary for one crafter -
 * quality plus whichever of skill/concentration is the relevant number
 * for that outcome. Every value here is read directly off the crafter's
 * already-computed recommendation; nothing is invented or estimated.
 */
export function getInlineCraftResultLabel(
  crafter: ProfessionRecipeCrafter
): string {
  const {
    craftStatus,
    recommendation
  } = crafter;

  const quality =
    recommendation.craftingQuality;

  switch (craftStatus) {
    case "SAFE":
      if (quality === null) {
        return "No Concentration";
      }

      return recommendation
        .effectiveSkill !== null
        ? `Q${quality} · Skill ${recommendation.effectiveSkill}`
        : `Q${quality}`;

    case "CONCENTRATION":
      if (quality === null) {
        return "Needs Concentration";
      }

      return recommendation
        .concentrationCost !== null
        ? `Q${quality} · ${recommendation.concentrationCost} Conc`
        : `Q${quality} · Conc`;

    case "NOT_SAFE":
      return quality !== null
        ? `Cannot reach Q${quality}`
        : "Cannot Reach";

    case "UNKNOWN":
      return "Unknown";
  }
}
