export type ProfessionWeeklyCharacterRow = {
  id: string;
  name: string;
};

export type ProfessionWeeklySnapshotRow = {
  characterId: string;
  sourceDefinitionId: string;
  state: string;
  currentValue: number | null;
  maxValue: number | null;
  capturedAt: Date;
};

export interface ProfessionWeeklyStatusRepositoryContract {
  findCharacters(): Promise<ProfessionWeeklyCharacterRow[]>;
  /*
   * Only the CURRENT weekly period's rows are ever read - a stale prior
   * week must never be misread as current (see the Prisma schema
   * comment on CharacterProfessionWeeklySnapshot).
   */
  findSnapshotsForPeriod(
    sourceDefinitionIds: string[],
    periodKey: string
  ): Promise<ProfessionWeeklySnapshotRow[]>;
  findProfessionNamesByKeys(
    professionKeys: string[]
  ): Promise<Map<string, string>>;
}
