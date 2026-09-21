import type {
  ProfessionRecipeCraftStatus
} from "../details/profession-recipe.types.js";

export type PublicCraftStatus = ProfessionRecipeCraftStatus;

export type PublicCrafterShareRecipe = {
  name: string;
  itemQuality: string | null;
  itemLevel: number | null;
  iconUrl: string | null;
  resultQuality: number | null;
  craftStatus: PublicCraftStatus;
  slotName: string | null;
};

export type PublicCrafterShareProfession = {
  name: string;
  recipes: PublicCrafterShareRecipe[];
};

export type PublicCrafterShareCharacter = {
  name: string;
  realm: string;
  className: string;
  professions: PublicCrafterShareProfession[];
};

export type PublicCrafterShareCard = {
  battleTag: string | null;
  characters: PublicCrafterShareCharacter[];
};

export type CrafterShareStatus = {
  enabled: boolean;
  publicUrl: string | null;
};

export type CrafterShareRecipeRecord = {
  learned: boolean;
  baseSkill: number | null;
  bonusSkill: number | null;
  effectiveSkill: number | null;
  craftingQuality: number | null;
  craftingQualityId: number | null;
  guaranteedCraftingQualityId: number | null;
  lowerSkillThreshold: number | null;
  upperSkillThreshold: number | null;
  concentrationCost: number | null;
  concentrationCurrencyId: number | null;
  ingenuityRefund: number | null;
  quality: number | null;
  operationMetricsJson: string | null;
  operationCapturedAt: Date | null;
  operationCaptureVersion: number | null;
  operationScopeVersion: number | null;
  reagentSimulationJson: string | null;
  recipe: {
    name: string;
    itemQuality: string | null;
    itemLevel: number | null;
    iconUrl: string | null;
    baseDifficulty: number | null;
    capabilities: Array<{
      isPrimary: boolean;
      capability: {
        name: string;
        type: string;
        slotKey: string | null;
      };
    }>;
  };
};

export type CrafterShareProfessionRecord = {
  profession: {
    name: string;
  };
  recipes: CrafterShareRecipeRecord[];
};

export type CrafterShareCharacterRecord = {
  name: string;
  realm: string;
  className: string;
  professions: CrafterShareProfessionRecord[];
};

export type CrafterSharePublicRecord = {
  battleTag: string | null;
  characters: CrafterShareCharacterRecord[];
};
