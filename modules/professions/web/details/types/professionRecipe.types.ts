export type ProfessionRecipeCapability = {
  id: string;
  key: string;
  name: string;
  type: string;
  slotKey: string | null;
  description: string | null;
  isPrimary: boolean;
};

export type ProfessionRecipeBaselineStatus =
  | "UNKNOWN"
  | "BASE_SKILL_SUFFICIENT"
  | "RECIPE_BONUS_REQUIRED";

export type ProfessionRecipeCraftStatus =
  | "SAFE"
  | "CONCENTRATION"
  | "NOT_SAFE"
  | "UNKNOWN";

export type ProfessionRecipeOperationStatus =
  | "CAPTURED"
  | "MISSING";

export type ProfessionRecipeOperation = {
  status:
    ProfessionRecipeOperationStatus;
  baseSkill: number | null;
  bonusSkill: number | null;
  effectiveSkill: number | null;
  craftingQuality: number | null;
  craftingQualityId: number | null;
  guaranteedCraftingQualityId:
    number | null;
  lowerSkillThreshold: number | null;
  upperSkillThreshold: number | null;
  concentrationCost: number | null;
  concentrationCurrencyId:
    number | null;
  ingenuityRefund: number | null;
  quality: number | null;
  capturedAt: string | null;
  captureVersion: number | null;
  scopeVersion: number | null;
};

export type ProfessionRecipeReagentSimulationStatus =
  | "CAPTURED"
  | "NO_REQUIRED_MODIFIED_REAGENTS"
  | "INCOMPLETE_REAGENTS"
  | "OPERATION_UNAVAILABLE"
  | "UNKNOWN";

export type ProfessionRecipeQualityScenarioStatus =
  | "CAPTURED"
  | "PARTIAL"
  | "NO_QUALITY_SLOTS"
  | "TOO_MANY_COMBINATIONS"
  | "INCOMPLETE_REAGENTS"
  | "OPERATION_UNAVAILABLE"
  | "UNKNOWN";

export type ProfessionRecipeSimulationResult = {
  craftStatus:
    ProfessionRecipeCraftStatus;
  operation:
    ProfessionRecipeOperation;
};

export type ProfessionRecipeReagentSelection = {
  slotIndex: number;
  dataSlotIndex: number;
  candidateIndex: number;
  itemId: number | null;
  currencyId: number | null;
  quality: number | null;
  quantity: number;
};

export type ProfessionRecipeQualityScenario = {
  scenarioIndex: number;
  qualityScore: number;
  qualitySignature: string | null;
  selections:
    ProfessionRecipeReagentSelection[];
  result:
    ProfessionRecipeSimulationResult;
};

export type ProfessionRecipeReagentSimulation = {
  status:
    ProfessionRecipeReagentSimulationStatus;
  captureVersion: number | null;
  requiredModifiedSlotCount: number;
  simulatedSlotCount: number;
  qualitySlotCount: number;
  concentrationCaptured: boolean;
  lowestQuality:
    ProfessionRecipeSimulationResult;
  highestQuality:
    ProfessionRecipeSimulationResult;
  highestQualityWithConcentration:
    ProfessionRecipeSimulationResult;
  qualityScenarioStatus:
    ProfessionRecipeQualityScenarioStatus;
  qualityScenarioLimit: number;
  qualityScenarioCombinationCount: number;
  qualityScenarioCapturedCount: number;
  qualityScenarios:
    ProfessionRecipeQualityScenario[];
};

export type ProfessionRecipeRecommendationKind =
  | "LOW_MATS"
  | "MINIMUM_MATS"
  | "HIGH_MATS"
  | "HIGH_MATS_CONCENTRATION"
  | "NOT_REACHABLE"
  | "UNKNOWN";

export type ProfessionRecipeCrafterRecommendation = {
  kind:
    ProfessionRecipeRecommendationKind;
  craftStatus:
    ProfessionRecipeCraftStatus;
  effectiveSkill: number | null;
  craftingQuality: number | null;
  concentrationCost: number | null;
  selections:
    ProfessionRecipeReagentSelection[];
};

export type ProfessionRecipeOperationCoverage = {
  totalCrafterCount: number;
  capturedCrafterCount: number;
  missingCrafterCount: number;
  coveragePercent: number;
};

export type ProfessionRecipeCrafter = {
  characterId: string;
  name: string;
  realm: string;
  className: string;
  level: number;
  skill: number;
  skillModifier: number;
  effectiveSkill: number;
  knowledgePoints: number;
  baselineStatus:
    ProfessionRecipeBaselineStatus;
  baselineSkillGap: number | null;
  baselineSkillSurplus: number | null;
  craftStatus:
    ProfessionRecipeCraftStatus;
  operation:
    ProfessionRecipeOperation;
  reagentSimulation:
    ProfessionRecipeReagentSimulation | null;
  recommendation:
    ProfessionRecipeCrafterRecommendation;
  source: string;
  lastSyncedAt: string | null;
};

export type ProfessionRecipeCatalogItem = {
  id: string;
  gameRecipeId: number;
  name: string;
  expansion: string;
  categoryId: number | null;
  craftedItemId: number | null;
  iconUrl: string | null;
  itemQuality: string | null;
  itemLevel: number | null;
  baseDifficulty: number | null;
  craftStatus:
    ProfessionRecipeCraftStatus;
  capabilities:
    ProfessionRecipeCapability[];
  crafters:
    ProfessionRecipeCrafter[];
  operationCoverage:
    ProfessionRecipeOperationCoverage;
};

export type ProfessionRecipeCatalogSummary = {
  catalogRecipeCount: number;
  craftableRecipeCount: number;
  missingRecipeCount: number;
  crafterRecipeCount: number;
  operationCapturedCrafterRecipeCount:
    number;
  operationMissingCrafterRecipeCount:
    number;
  operationCoveragePercent: number;
};

export type ProfessionRecipeCatalog = {
  profession: {
    id: string;
    key: string;
    name: string;
  };
  summary:
    ProfessionRecipeCatalogSummary;
  items:
    ProfessionRecipeCatalogItem[];
};