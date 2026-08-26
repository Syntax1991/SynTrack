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

/*
 * A character's investment in a specialization TREE ROOT node (e.g.
 * "Flawless Fortes", "Learned Leatherworker", "Lasting Leather") - the
 * general/overall tree-tier investment, independent of whether that
 * tree maps to a curated equipment family/slot at all. This is what
 * proves a character like Synbomb (invested only in the two generalist
 * trees) is NOT "not specialized" - he simply has no EQUIPMENT-slot
 * specialization, which is a narrower, separate fact.
 */
export type ProfessionGeneralSpecializationEntry = {
  nodeKey: string;
  nodeName: string;
  nodeIconUrl: string | null;
  rank: number;
  maxRank: number | null;
};

/*
 * The relevant SPECIFIC sub-node for one (family, slot) pair, always
 * present - including a character with zero investment there (rank: 0).
 * This is the explicit alternative to a vague "Not specialized" label:
 * the actual node and its current/max rank, never omitted just because
 * the rank happens to be zero.
 */
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
};

/*
 * EVERY curated node relevant to one (family, slot) pair - never
 * collapsed to a single value. A slot covered by both a specific node
 * and a multi-slot bundle node produces one entry per node, each with
 * its own real rank, so a rank is never shown without the concrete
 * node identity it belongs to.
 */
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
  craftableEquipment: ProfessionEquipmentCraftEntry[];
  specializationEquipment: ProfessionSpecializationEquipmentClaim[];
  generalSpecialization: ProfessionGeneralSpecializationEntry[];
  explicitSlotNodeRanks: ProfessionExplicitSlotNodeRank[];
  slotSpecializationNodes: ProfessionSlotSpecializationNode[];
  recipes: ProfessionRecipeCoverage[];
  capabilities: ProfessionCapabilityCoverage[];
};

export type ProfessionCaptureStatus =
  | "CAPTURED"
  | "NOT_CAPTURED"
  | "NOT_REQUIRED";

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
  captureStatus: ProfessionCaptureStatus;
  lastCapturedAt: string | null;
};

export type ProfessionDetailView = {
  profession: {
    id: string;
    key: string;
    name: string;
    category: string;
  };
  /*
   * Whether an ID-keyed specialization-equipment mapping exists for this
   * profession at all (see profession-specialization-equipment
   * .definitions.ts). false means every character's specializationEquipment
   * list is necessarily empty NOT because nothing was invested, but
   * because SynTrack cannot yet prove specialization alignment for this
   * profession - the UI must render UNKNOWN, not "not specialized", in
   * that case.
   */
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
  characters: ProfessionCharacterCoverage[];
};