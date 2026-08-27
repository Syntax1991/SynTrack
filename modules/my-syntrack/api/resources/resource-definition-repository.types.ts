import type { ResourceDefinitionSeedInput } from "./resource-definition.types.js";

/*
 * Plain-data contract the service depends on, rather than the concrete
 * Prisma-backed repository class - mirrors
 * TrackerDefinitionRepositoryContract so tests can inject a lightweight
 * in-memory fake (resource-definition.fakes.ts).
 */
export type ResourceDefinitionRow = {
  id: string;
  key: string;
  scopeKey: string;
  externalCurrencyId: number | null;
  externalItemId: number | null;
  name: string;
  category: string;
  resetBehavior: string;
  ownershipScope: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface ResourceDefinitionRepositoryContract {
  findByScopeKeys(
    scopeKeys: string[]
  ): Promise<ResourceDefinitionRow[]>;
  findByKey(
    key: string
  ): Promise<ResourceDefinitionRow | null>;
  upsertByKey(
    input: ResourceDefinitionSeedInput
  ): Promise<ResourceDefinitionRow>;
}
