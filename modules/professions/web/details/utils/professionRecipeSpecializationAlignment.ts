import type {
  ProfessionRecipeCatalogItem
} from "../types/professionRecipe.types";
import type {
  ProfessionSpecializationEquipmentClaim
} from "../types/professionDetail.types";
import {
  getProfessionRecipeFamilyName
} from "./professionRecipePresentation";

export type RecipeSpecializationAlignment =
  | {
      state: "SPECIALIZED";
      rank: number;
      maxRank: number | null;
      nodeName: string;
    }
  | { state: "NOT_SPECIALIZED" }
  | { state: "UNKNOWN" }
  | { state: "NOT_APPLICABLE" };

function findRecipeSlotKey(
  recipe: ProfessionRecipeCatalogItem
): string | null {
  return (
    recipe.capabilities.find(
      (capability) =>
        capability.type ===
          "EQUIPMENT_SLOT" ||
        capability.slotKey !== null
    )?.slotKey ?? null
  );
}

/*
 * Deliberately independent of Known Recipe state and craft-simulation
 * state: this only asks "does the character have proven Specialization
 * Knowledge investment for this recipe's exact armor family + slot",
 * using the same ID-backed claims produced by
 * profession-specialization-equipment.mapper.ts.
 *
 * Two distinct "we can't say yes" outcomes are kept separate on purpose:
 * NOT_APPLICABLE means the recipe itself isn't an armor-family+slot
 * recipe at all (reagents, profession accessories, consumables) - the
 * concept of armor Specialization simply doesn't apply, so this is not a
 * gap in SynTrack's knowledge. UNKNOWN means the recipe IS an equipment
 * recipe but this profession has no curated ID mapping yet - SynTrack
 * should be able to answer this but currently cannot. Neither is ever
 * treated as a negative (NOT_SPECIALIZED).
 */
export function resolveRecipeSpecializationAlignment(
  recipe: ProfessionRecipeCatalogItem,
  specializationEquipment:
    ProfessionSpecializationEquipmentClaim[],
  specializationMappingAvailable: boolean
): RecipeSpecializationAlignment {
  const familyName =
    getProfessionRecipeFamilyName(
      recipe
    );

  const slotKey =
    findRecipeSlotKey(
      recipe
    );

  if (
    !familyName ||
    !slotKey
  ) {
    return { state: "NOT_APPLICABLE" };
  }

  if (!specializationMappingAvailable) {
    return { state: "UNKNOWN" };
  }

  const claim =
    specializationEquipment.find(
      (candidate) =>
        candidate.familyName ===
          familyName &&
        candidate.slotKey === slotKey
    );

  if (!claim) {
    return { state: "NOT_SPECIALIZED" };
  }

  return {
    state: "SPECIALIZED",
    rank: claim.rank,
    maxRank: claim.maxRank,
    nodeName: claim.nodeName
  };
}

export function getRecipeSpecializationLabel(
  alignment: RecipeSpecializationAlignment
): string {
  switch (alignment.state) {
    case "SPECIALIZED":
      return (
        `${alignment.nodeName} ${alignment.rank}` +
        (
          alignment.maxRank !== null
            ? `/${alignment.maxRank}`
            : ""
        )
      );

    case "NOT_SPECIALIZED":
      return "Not specialized";

    case "UNKNOWN":
      return "Unknown";

    case "NOT_APPLICABLE":
      return "—";
  }
}
