import type {
  PublicCraftStatus,
  PublicCrafterShareRecipe
} from "./types/crafterShare.types";

export function getPublicCraftStatusLabel(
  status: PublicCraftStatus
): string {
  switch (status) {
    case "SAFE":
      return "No Concentration";
    case "CONCENTRATION":
      return "Needs Concentration";
    case "UNKNOWN":
      return "Unknown";
    case "NOT_SAFE":
      return "Not max quality";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

/*
 * Same quality Find Craft recommends (best captured mats/concentration).
 * NOT_SAFE is "can craft, not the last quality step" - not "cannot craft".
 */
export function getPublicCrafterShareCraftLabel(
  recipe: PublicCrafterShareRecipe
): string {
  const quality =
    recipe.resultQuality !== null ? `Q${recipe.resultQuality}` : null;

  switch (recipe.craftStatus) {
    case "SAFE":
      return quality ?? "No Concentration";
    case "CONCENTRATION":
      return quality ? `${quality} · Conc` : "Needs Concentration";
    case "NOT_SAFE":
      return quality ? `${quality} · not max` : "Not max quality";
    case "UNKNOWN":
      return "Unknown";
    default: {
      const exhaustive: never = recipe.craftStatus;
      return exhaustive;
    }
  }
}
