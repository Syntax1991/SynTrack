export const resourceCategories = [
  "UPGRADE",
  "CRAFTING_GATE",
  "CONVERSION",
  "OTHER"
] as const;

export type ResourceCategory =
  (typeof resourceCategories)[number];

export const resourceOwnershipScopes = [
  "CHARACTER",
  "ACCOUNT_WIDE",
  "UNKNOWN"
] as const;

export type ResourceOwnershipScope =
  (typeof resourceOwnershipScopes)[number];

/*
 * Reuses the exact same reset-behavior vocabulary as
 * CharacterTrackerDefinition (see the Prisma schema's TrackerResetBehavior
 * enum) rather than introducing a second, parallel reset concept.
 */
export const resourceResetBehaviors = [
  "WEEKLY",
  "SEASONAL",
  "PERMANENT"
] as const;

export type ResourceResetBehavior =
  (typeof resourceResetBehaviors)[number];

export type ResourceDefinitionView = {
  id: string;
  key: string;
  scopeKey: string;
  externalCurrencyId: number | null;
  externalItemId: number | null;
  name: string;
  category: ResourceCategory;
  resetBehavior: ResourceResetBehavior;
  ownershipScope: ResourceOwnershipScope;
  enabled: boolean;
  sortOrder: number;
};

/*
 * The one seed/config shape a season's real, live-confirmed resources
 * are declared through (see resource-definition.service.ts's
 * ensureDefinition) - deliberately the only place season-specific
 * WoW ids are meant to live in application code.
 */
export type ResourceDefinitionSeedInput = {
  key: string;
  scopeKey: string;
  externalCurrencyId?: number | null;
  externalItemId?: number | null;
  name: string;
  category: ResourceCategory;
  resetBehavior: ResourceResetBehavior;
  ownershipScope: ResourceOwnershipScope;
  enabled?: boolean;
  sortOrder?: number;
};
