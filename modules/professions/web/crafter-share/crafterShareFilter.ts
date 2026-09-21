import type {
  PublicCrafterShareCard,
  PublicCrafterShareCharacter,
  PublicCrafterShareProfession,
  PublicCrafterShareRecipe
} from "./types/crafterShare.types";

export type PublicCrafterShareQualityFilter =
  | "ALL"
  | "RARE_OR_EPIC"
  | "EPIC"
  | "RARE";

export type PublicCrafterShareFilters = {
  query: string;
  quality: PublicCrafterShareQualityFilter;
  minItemLevel: number | null;
};

/*
 * Midnight crafted gear is stored as Blizzard Rare far more often than
 * Epic. Epic-only hid almost all armor after reagents (also often Epic,
 * e.g. Sunfire Silk Bolt) were removed by the gear-slot gate.
 */
export const DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS: PublicCrafterShareFilters = {
  query: "",
  quality: "RARE_OR_EPIC",
  minItemLevel: null
};

export function parseMinItemLevel(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function matchesPublicCrafterShareQuality(
  recipe: PublicCrafterShareRecipe,
  quality: PublicCrafterShareQualityFilter
): boolean {
  if (quality === "ALL") {
    return true;
  }

  if (quality === "RARE_OR_EPIC") {
    return recipe.itemQuality === "RARE" || recipe.itemQuality === "EPIC";
  }

  return recipe.itemQuality === quality;
}

function matchesQuery(
  recipe: PublicCrafterShareRecipe,
  query: string
): boolean {
  const normalized = query.trim().toLowerCase();

  if (normalized === "") {
    return true;
  }

  const haystack = [recipe.name, recipe.slotName ?? ""]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function matchesMinItemLevel(
  recipe: PublicCrafterShareRecipe,
  minItemLevel: number | null
): boolean {
  if (minItemLevel === null) {
    return true;
  }

  /*
   * A recipe without a stored Blizzard item level is not assumed to
   * reach the requested minimum. UNKNOWN > WRONG.
   */
  if (recipe.itemLevel === null) {
    return false;
  }

  return recipe.itemLevel >= minItemLevel;
}

export function matchesPublicCrafterShareRecipe(
  recipe: PublicCrafterShareRecipe,
  filters: PublicCrafterShareFilters
): boolean {
  return (
    matchesPublicCrafterShareQuality(recipe, filters.quality) &&
    matchesQuery(recipe, filters.query) &&
    matchesMinItemLevel(recipe, filters.minItemLevel)
  );
}

function filterProfession(
  profession: PublicCrafterShareProfession,
  filters: PublicCrafterShareFilters
): PublicCrafterShareProfession | null {
  const recipes = profession.recipes.filter((recipe) =>
    matchesPublicCrafterShareRecipe(recipe, filters)
  );

  if (recipes.length === 0) {
    return null;
  }

  return {
    ...profession,
    recipes
  };
}

function filterCharacter(
  character: PublicCrafterShareCharacter,
  filters: PublicCrafterShareFilters
): PublicCrafterShareCharacter | null {
  const professions = character.professions
    .map((profession) => filterProfession(profession, filters))
    .filter(
      (profession): profession is PublicCrafterShareProfession =>
        profession !== null
    );

  if (professions.length === 0) {
    return null;
  }

  return {
    ...character,
    professions
  };
}

export function filterPublicCrafterShareCard(
  card: PublicCrafterShareCard,
  filters: PublicCrafterShareFilters
): PublicCrafterShareCard {
  return {
    battleTag: card.battleTag,
    characters: card.characters
      .map((character) => filterCharacter(character, filters))
      .filter(
        (character): character is PublicCrafterShareCharacter =>
          character !== null
      )
  };
}
