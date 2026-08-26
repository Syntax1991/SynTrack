import type {
  ProfessionRecipeCapability,
  ProfessionRecipeCatalogItem
} from "../types/professionRecipe.types";
import {
  professionRecipeSlotNames
} from "./professionRecipePresentation.rules";

/*
 * Equipment family and slot must come from the recipe's own, already-
 * verified EQUIPMENT_FAMILY/EQUIPMENT_SLOT capability rows (backed by the
 * item's real Blizzard equip-location enum and the recipe's own category).
 * There is intentionally no free-text fallback here: guessing a family or
 * slot from a recipe's display name reproduced the same class of false
 * positive that "Wonderful Wristguards" caused for specialization coverage.
 * Absent capability data means UNKNOWN, not a guess.
 */
function findFamily(
  capabilities:
    ProfessionRecipeCapability[]
): string | null {
  const explicit =
    capabilities.find(
      (capability) =>
        capability.type ===
        "EQUIPMENT_FAMILY"
    );

  return explicit?.name ??
    null;
}

function findExplicitSlot(
  capabilities:
    ProfessionRecipeCapability[]
): string | null {
  const capability =
    capabilities.find(
      (candidate) =>
        candidate.type ===
          "EQUIPMENT_SLOT" ||
        candidate.slotKey !== null
    );

  if (!capability) {
    return null;
  }

  if (
    capability.slotKey &&
    professionRecipeSlotNames[
      capability.slotKey
    ]
  ) {
    return professionRecipeSlotNames[
      capability.slotKey
    ];
  }

  return capability.name;
}

function getFallbackGroup(
  recipe:
    ProfessionRecipeCatalogItem
): string {
  const primary =
    recipe.capabilities.find(
      (capability) =>
        capability.isPrimary
    );

  if (primary) {
    return primary.name;
  }

  const preferred =
    recipe.capabilities.find(
      (capability) =>
        capability.type ===
          "PRODUCT_CATEGORY" ||
        capability.type ===
          "RECIPE_GROUP"
    );

  return (
    preferred?.name ??
    recipe.capabilities[0]
      ?.name ??
    "Other"
  );
}

export function getProfessionRecipeFamilyName(
  recipe:
    ProfessionRecipeCatalogItem
): string | null {
  return findFamily(
    recipe.capabilities
  );
}

export function getProfessionRecipeSlotName(
  recipe:
    ProfessionRecipeCatalogItem
): string | null {
  return findExplicitSlot(
    recipe.capabilities
  );
}

export function getProfessionRecipeProductLabel(
  recipe:
    ProfessionRecipeCatalogItem
): string {
  const family =
    getProfessionRecipeFamilyName(
      recipe
    );

  const slot =
    getProfessionRecipeSlotName(
      recipe
    );

  if (
    family &&
    slot
  ) {
    return (
      `${family} · ${slot}`
    );
  }

  if (slot) {
    return slot;
  }

  if (family) {
    return family;
  }

  return getFallbackGroup(
    recipe
  );
}

export function getProfessionRecipeGroupName(
  recipe:
    ProfessionRecipeCatalogItem
): string {
  return (
    getProfessionRecipeFamilyName(
      recipe
    ) ??
    getFallbackGroup(
      recipe
    )
  );
}