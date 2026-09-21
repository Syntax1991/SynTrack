import {
  calculateProfessionRecipeCrafterCraftStatus,
  createProfessionRecipeCrafterRecommendation
} from "../details/profession-recipe-crafter-assessment.js";
import { calculateProfessionRecipeCraftStatus } from "../details/profession-recipe-craft-status.js";
import { mapProfessionRecipeOperation } from "../details/profession-recipe-operation.mapper.js";
import { mapProfessionRecipeReagentSimulation } from "../details/profession-recipe-simulation.mapper.js";
import {
  getPublicCrafterShareGearSlotName,
  isPublicCrafterSharePlayerGear
} from "./crafter-share.gear.js";
import type {
  CrafterShareCharacterRecord,
  CrafterShareProfessionRecord,
  CrafterSharePublicRecord,
  CrafterShareRecipeRecord,
  PublicCrafterShareCard,
  PublicCrafterShareCharacter,
  PublicCrafterShareProfession,
  PublicCrafterShareRecipe,
  PublicCraftStatus
} from "./crafter-share.types.js";

function mapShareableRecipe(
  record: CrafterShareRecipeRecord
): PublicCrafterShareRecipe | null {
  if (!record.learned) {
    return null;
  }

  const capabilities = record.recipe.capabilities.map(
    (entry) => entry.capability
  );

  if (!isPublicCrafterSharePlayerGear(capabilities)) {
    return null;
  }

  const operation = mapProfessionRecipeOperation(record);
  const defaultCraftStatus = calculateProfessionRecipeCraftStatus(
    record.recipe.baseDifficulty,
    operation
  );
  const reagentSimulation = mapProfessionRecipeReagentSimulation(
    record.recipe.baseDifficulty,
    record.reagentSimulationJson
  );
  const recommendation = createProfessionRecipeCrafterRecommendation(
    reagentSimulation
  );

  return {
    name: record.recipe.name,
    itemQuality: record.recipe.itemQuality,
    itemLevel: record.recipe.itemLevel,
    iconUrl: record.recipe.iconUrl,
    resultQuality:
      recommendation.craftingQuality ?? record.craftingQuality,
    craftStatus: calculateProfessionRecipeCrafterCraftStatus(
      defaultCraftStatus,
      reagentSimulation
    ) as PublicCraftStatus,
    slotName: getPublicCrafterShareGearSlotName(capabilities)
  };
}

function mapProfession(
  record: CrafterShareProfessionRecord
): PublicCrafterShareProfession | null {
  const recipes = record.recipes
    .map(mapShareableRecipe)
    .filter((recipe): recipe is PublicCrafterShareRecipe => recipe !== null)
    .sort((left, right) => left.name.localeCompare(right.name));

  if (recipes.length === 0) {
    return null;
  }

  return {
    name: record.profession.name,
    recipes
  };
}

function mapCharacter(
  record: CrafterShareCharacterRecord
): PublicCrafterShareCharacter | null {
  const professions = record.professions
    .map(mapProfession)
    .filter(
      (profession): profession is PublicCrafterShareProfession =>
        profession !== null
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  if (professions.length === 0) {
    return null;
  }

  return {
    name: record.name,
    realm: record.realm,
    className: record.className,
    professions
  };
}

export function mapPublicCrafterShareCard(
  record: CrafterSharePublicRecord
): PublicCrafterShareCard {
  const characters = record.characters
    .map(mapCharacter)
    .filter(
      (character): character is PublicCrafterShareCharacter =>
        character !== null
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    battleTag: record.battleTag,
    characters
  };
}

