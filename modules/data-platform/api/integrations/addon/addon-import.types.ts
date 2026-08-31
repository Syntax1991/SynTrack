import type { AddonResourceSnapshot } from "./addon-import.resource.types.js";
import type { AddonProfessionKnowledgeTreasureSnapshot } from "./addon-import.profession-knowledge-treasure.types.js";
import type { AddonProfessionWeeklySnapshot } from "./addon-import.profession-weekly.types.js";
import type { AddonWeeklyActivitySnapshot } from "./addon-import.weekly-activity.types.js";

export type LuaValue =
  | string
  | number
  | boolean
  | null
  | LuaTable;

export type LuaTable = {
  [key: string]: LuaValue;
};

export type AddonRecipeOperationMetric =
  | string
  | number
  | boolean;

export type AddonRecipeOperationMetrics =
  Record<
    string,
    AddonRecipeOperationMetric
  >;

export type AddonClientInfo = {
  version: string | null;
  build: string | null;
  interfaceVersion: number | null;
};

export type AddonSpecializationNode = {
  externalNodeId: number;
  name: string;
  description: string | null;
  maxRank: number | null;
  knowledgeEntryId: number | null;
  knowledgeMaxRank: number | null;
  spellId: number | null;
  sortOrder: number;
  isRoot: boolean;
};

export type AddonSpecializationTree = {
  externalTreeId: number;
  name: string;
  description: string | null;
  rootNodeExternalId: number | null;
  sortOrder: number;
  nodes: AddonSpecializationNode[];
};

export type AddonProfessionCatalog = {
  skillLineId: number;
  displayName: string;
  expansionName: string | null;
  trees: AddonSpecializationTree[];
};

export type AddonRecipeReagentCandidate = {
  candidateIndex: number;
  itemId: number | null;
  currencyId: number | null;
  quality: number | null;
};

export type AddonRecipeReagentSlot = {
  slotIndex: number;
  dataSlotIndex: number;
  dataSlotType: number;
  reagentType: number;
  quantityRequired: number;
  required: boolean;
  orderSource: number | null;
  hiddenInCraftingForm: boolean;
  reagents:
    AddonRecipeReagentCandidate[];
};

export type AddonRecipeReagentSchema = {
  recipeId: number;
  recipeType: number | null;
  outputItemId: number | null;
  quantityMin: number;
  quantityMax: number;
  hasCraftingOperationInfo: boolean;
  isRecraft: boolean;
  reagentSlots:
    AddonRecipeReagentSlot[];
};

export type AddonRecipe = {
  gameRecipeId: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  parentCategoryId: number | null;
  parentCategoryName: string | null;
  outputItemId: number | null;
  outputItemEquipLoc: string | null;
  outputItemClassId: number | null;
  outputItemSubclassId: number | null;
  outputItemArmorSubclassKey: string | null;
  outputItemWeaponSubclassKey: string | null;
  baseDifficulty: number | null;
  operationMetrics:
    AddonRecipeOperationMetrics;
  reagentSchema:
    AddonRecipeReagentSchema | null;
  reagentSchemaJson: string | null;
};

export type AddonRecipeCatalog = {
  skillLineId: number;
  displayName: string;
  expansionName: string | null;
  recipes: AddonRecipe[];
  capturedAt: string | null;
};

export type AddonCharacterRecipeReagentSelection = {
  slotIndex: number;
  dataSlotIndex: number;
  candidateIndex: number;
  itemId: number | null;
  currencyId: number | null;
  quality: number | null;
  quantity: number;
};

export type AddonCharacterRecipeQualityScenario = {
  scenarioIndex: number;
  qualityScore: number;
  qualitySignature: string | null;
  selections:
    AddonCharacterRecipeReagentSelection[];
  operationMetrics:
    AddonRecipeOperationMetrics;
};

export type AddonCharacterRecipeReagentSimulation = {
  captureVersion: number;
  status: string | null;
  requiredModifiedSlotCount: number;
  simulatedSlotCount: number;
  qualitySlotCount: number;
  concentrationCaptured: boolean;

  lowestQualityOperation:
    AddonRecipeOperationMetrics;

  highestQualityOperation:
    AddonRecipeOperationMetrics;

  highestQualityConcentrationOperation:
    AddonRecipeOperationMetrics;

  qualityScenarioStatus: string | null;
  qualityScenarioLimit: number;
  qualityScenarioCombinationCount: number;
  qualityScenarioCapturedCount: number;

  qualityScenarios:
    AddonCharacterRecipeQualityScenario[];
};

export type AddonCharacterRecipeOperation = {
  gameRecipeId: number;
  operationMetrics:
    AddonRecipeOperationMetrics;

  reagentSimulation:
    AddonCharacterRecipeReagentSimulation | null;
};

export type AddonCharacterRecipeOperationCapture = {
  characterKey: string;
  skillLineId: number;
  captureVersion: number;
  scopeVersion: number;
  displayName: string | null;
  expansionName: string | null;
  parentSkillLineId: number | null;
  parentProfessionName: string | null;
  status: string | null;
  learnedRecipeCount: number;
  operationEligibleCount: number;
  operationRecipeCount: number;
  capturedAt: string | null;

  recipes:
    AddonCharacterRecipeOperation[];
};

export type AddonNodeProgress = {
  externalTreeId: number;
  externalNodeId: number;
  rank: number;
  knowledgeRank: number;
  unlockRank: number;
};

export type AddonExpansion = {
  skillLineId: number;
  displayName: string;
  expansionName: string | null;
  knowledgeAvailable: number;
  investedKnowledge: number;
  progress: AddonNodeProgress[];
  recipeIds: number[] | null;
  recipeCapturedAt: string | null;
  capturedAt: string | null;
};

export type AddonProfession = {
  name: string;
  professionKey: string | null;
  skillLineId: number | null;
  skillLevel: number;
  maxSkillLevel: number;
  skillModifier: number;
  activeExpansionSkillLineId: number | null;
  expansions: AddonExpansion[];
};

export type {
  AddonGearBagSetPiece,
  AddonGearSlot,
  AddonGearSnapshot
} from "./addon-import.gear.types.js";

import type { AddonGearSnapshot } from "./addon-import.gear.types.js";

export type AddonCharacter = {
  key: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
  snapshotReason: string | null;
  lastUpdatedAt: string | null;
  professions: AddonProfession[];
  gear: AddonGearSnapshot | null;
  resources: AddonResourceSnapshot | null;
  professionWeekly: AddonProfessionWeeklySnapshot | null;
  professionKnowledgeTreasures: AddonProfessionKnowledgeTreasureSnapshot | null;
  weeklyActivity: AddonWeeklyActivitySnapshot | null;
};

export type AddonSnapshot = {
  addonVersion: string;
  schemaVersion: number;
  client: AddonClientInfo;
  catalogs: AddonProfessionCatalog[];
  recipeCatalogs: AddonRecipeCatalog[];

  characterRecipeOperations:
    AddonCharacterRecipeOperationCapture[];

  characters: AddonCharacter[];
};

export type AddonCatalogPreview = {
  skillLineId: number;
  displayName: string;
  expansionName: string | null;
  trees: number;
  specializationNodes: number;
};

export type AddonProfessionPreview = {
  name: string;
  professionKey: string | null;
  skillLevel: number;
  maxSkillLevel: number;
  expansions: number;
  investedKnowledge: number;
};

export type AddonCharacterPreview = {
  key: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
  professions: AddonProfessionPreview[];
};

export type AddonImportPreview = {
  addonVersion: string;
  schemaVersion: number;
  client: AddonClientInfo;
  catalogs: AddonCatalogPreview[];
  characters: AddonCharacterPreview[];

  totals: {
    characters: number;
    professionAssignments: number;
    expansions: number;
    trees: number;
    specializationNodes: number;
    investedNodes: number;
    investedKnowledge: number;
  };
};

export type AddonImportResult = {
  addonVersion: string;
  schemaVersion: number;
  importedAt: string;

  processed: {
    catalogs: number;
    trees: number;
    specializationNodes: number;
    characters: number;
    professionAssignments: number;
    progressEntries: number;
    gearSlots: number;
    resourceSnapshots: number;
    professionWeeklySnapshots: number;
    professionKnowledgeTreasureSnapshots: number;
    weeklyGameplaySnapshots: number;
  };
};