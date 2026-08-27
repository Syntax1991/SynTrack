import type { ResourceCategory } from "./resource-definition.types.js";

export type ResourceSnapshotView = {
  quantity: number | null;
  maxQuantity: number | null;
  weeklyQuantity: number | null;
  maxWeeklyQuantity: number | null;
  isCapped: boolean | null;
  weeklyRemaining: number | null;
  weeklyComplete: boolean | null;
  capturedAt: string;
};

/*
 * One entry per CHARACTER-scoped ResourceDefinition enabled for the
 * active season (+ GLOBAL), always present even when the character has
 * no captured snapshot for it yet - mirrors GearReadinessService's own
 * "always list every definition, snapshot nullable" shape, so a UI can
 * distinguish "not tracked" from "tracked, some fields still unknown".
 */
export type ResourceItemView = {
  resourceDefinitionId: string;
  key: string;
  name: string;
  category: ResourceCategory;
  snapshot: ResourceSnapshotView | null;
  attentionNeeded: boolean;
};

export type CharacterResourceOverview = {
  id: string;
  name: string;
  resources: ResourceItemView[];
  trackedResourceCount: number;
  totalRelevantResourceCount: number;
  attentionCount: number;
};

/*
 * One entry per ACCOUNT_WIDE ResourceDefinition - a single shared value,
 * never duplicated per character. capturedByCharacterId names which
 * character's snapshot the displayed value came from (the freshest one),
 * purely for transparency. ownershipMismatch is true when at least one
 * captured snapshot's raw accountWide evidence disagreed with the
 * definition's configured ACCOUNT_WIDE scope - snapshot stays null (no
 * value shown) only when EVERY captured snapshot disagreed.
 */
export type AccountResourceView = {
  resourceDefinitionId: string;
  key: string;
  name: string;
  category: ResourceCategory;
  capturedByCharacterId: string | null;
  ownershipMismatch: boolean;
  snapshot: ResourceSnapshotView | null;
  attentionNeeded: boolean;
};

export type ResourceOverviewResponse = {
  characters: CharacterResourceOverview[];
  accountResources: AccountResourceView[];
};
