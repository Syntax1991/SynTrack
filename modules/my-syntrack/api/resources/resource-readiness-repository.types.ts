export type ResourceCharacterRow = {
  id: string;
  name: string;
};

export type ResourceSnapshotRow = {
  characterId: string;
  resourceDefinitionId: string;
  quantity: number | null;
  maxQuantity: number | null;
  weeklyQuantity: number | null;
  maxWeeklyQuantity: number | null;
  isCapped: boolean | null;
  isWeeklyCapped: boolean | null;
  discovered: boolean | null;
  accountWide: boolean | null;
  capturedAt: Date;
};

export interface ResourceReadinessRepositoryContract {
  findCharacters(): Promise<ResourceCharacterRow[]>;
  findSnapshotsByDefinitionIds(
    resourceDefinitionIds: string[]
  ): Promise<ResourceSnapshotRow[]>;
}
