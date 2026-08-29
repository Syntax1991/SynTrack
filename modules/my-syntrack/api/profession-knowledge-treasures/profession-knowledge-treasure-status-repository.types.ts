export type ProfessionKnowledgeTreasureCharacterRow = {
  id: string;
  name: string;
  professionKeys: string[];
};

export type ProfessionKnowledgeTreasureSnapshotRow = {
  characterId: string;
  definitionId: string;
  state: string;
  capturedAt: Date;
};

export interface ProfessionKnowledgeTreasureStatusRepositoryContract {
  findCharacters(): Promise<
    ProfessionKnowledgeTreasureCharacterRow[]
  >;
  findSnapshots(
    definitionIds: string[]
  ): Promise<ProfessionKnowledgeTreasureSnapshotRow[]>;
  findProfessionNamesByKeys(
    professionKeys: string[]
  ): Promise<Map<string, string>>;
}
