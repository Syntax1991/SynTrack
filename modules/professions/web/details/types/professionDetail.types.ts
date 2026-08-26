export type ProfessionOverviewItem = {
  id: string;
  key: string;
  name: string;
  category: string;
  characterCount: number;
  trackedCharacterCount: number;
  activeNodeCount: number;
  catalogRecipeCount: number;
  capabilityCount: number;
  captureStatus:
    | "CAPTURED"
    | "NOT_CAPTURED"
    | "NOT_REQUIRED";
  lastCapturedAt: string | null;
};

export type ProfessionOverview = {
  items: ProfessionOverviewItem[];
};

export type ProfessionEquipmentCraftEntry = {
  id: string;
  familyName: string;
  slotKey: string;
  slotName: string;
  recipeCount: number;
};

export type ProfessionSpecializationEquipmentClaim = {
  id: string;
  provenance: "CURATED_VERIFIED";
  kind: string;
  capabilityKey: string;
  presentationGroup: string;
  familyName: string;
  slotKey: string;
  slotName: string;
  rank: number;
  maxRank: number | null;
  nodeName: string;
  nodeKey: string;
  nodeIconUrl: string | null;
};

export type ProfessionGeneralSpecializationEntry = {
  nodeKey: string;
  nodeName: string;
  nodeIconUrl: string | null;
  rank: number;
  maxRank: number | null;
};

export type ProfessionExplicitSlotNodeRank = {
  capabilityKey: string;
  presentationGroup: string;
  familyName: string;
  slotKey: string;
  slotName: string;
  nodeKey: string;
  nodeName: string;
  nodeIconUrl: string | null;
  rank: number;
  maxRank: number | null;
  hasProvenInvestment: boolean;
};

export type ProfessionSlotSpecializationNode = {
  capabilityKey: string;
  presentationGroup: string;
  familyName: string;
  slotKey: string;
  slotName: string;
  nodeKey: string;
  nodeName: string;
  nodeIconUrl: string | null;
  rank: number;
  maxRank: number | null;
};

export type ProfessionRecipeCoverage = {
  id: string;
  gameRecipeId: number;
  name: string;
  skillLineId: number | null;
  expansion: string;
  categoryId: number | null;
  source: string;
  lastSyncedAt: string | null;
};

export type ProfessionCapabilityCoverage = {
  id: string;
  key: string;
  name: string;
  type: string;
  slotKey: string | null;
  description: string | null;
  expansion: string;
  recipeCount: number;
  primaryRecipeCount: number;
};

export type ProfessionCharacterCoverage = {
  characterProfessionId: string;

  character: {
    id: string;
    name: string;
    realm: string;
    className: string;
    level: number;
  };

  skill: number;
  knowledgePoints: number;

  dataStatus:
    | "TRACKED"
    | "PARTIAL"
    | "UNTRACKED"
    | "NO_CATALOG";

  craftableEquipment:
    ProfessionEquipmentCraftEntry[];

  specializationEquipment:
    ProfessionSpecializationEquipmentClaim[];

  generalSpecialization:
    ProfessionGeneralSpecializationEntry[];

  explicitSlotNodeRanks:
    ProfessionExplicitSlotNodeRank[];

  slotSpecializationNodes:
    ProfessionSlotSpecializationNode[];

  recipes:
    ProfessionRecipeCoverage[];

  capabilities:
    ProfessionCapabilityCoverage[];
};

export type ProfessionDetail = {
  profession: {
    id: string;
    key: string;
    name: string;
    category: string;
  };

  specializationMappingAvailable: boolean;

  summary: {
    characterCount: number;
    trackedCharacterCount: number;
    missingCharacterCount: number;
    craftableEquipmentCount: number;
    catalogRecipeCount: number;
    learnedRecipeCount: number;
    catalogCapabilityCount: number;
    coveredCapabilityCount: number;
  };

  characters:
    ProfessionCharacterCoverage[];
};