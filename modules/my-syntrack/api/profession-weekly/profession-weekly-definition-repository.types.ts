import type { ProfessionWeeklySourceDefinitionSeedInput } from "./profession-weekly-definition.types.js";

/*
 * Plain-data contract the service depends on, rather than the concrete
 * Prisma-backed repository class - mirrors ResourceDefinitionRow so
 * tests can inject a lightweight in-memory fake
 * (profession-weekly-definition.fakes.ts).
 */
export type ProfessionWeeklySourceDefinitionRow = {
  id: string;
  scopeKey: string;
  professionKey: string;
  sourceKey: string;
  name: string;
  sourceType: string;
  externalQuestId: number | null;
  externalCurrencyId: number | null;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export interface ProfessionWeeklySourceDefinitionRepositoryContract {
  findByScopeKeys(
    scopeKeys: string[]
  ): Promise<ProfessionWeeklySourceDefinitionRow[]>;
  upsertByScopeProfessionSource(
    input: ProfessionWeeklySourceDefinitionSeedInput
  ): Promise<ProfessionWeeklySourceDefinitionRow>;
}
