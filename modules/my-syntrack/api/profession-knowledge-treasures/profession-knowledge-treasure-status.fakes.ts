import type {
  ProfessionKnowledgeTreasureCharacterRow,
  ProfessionKnowledgeTreasureSnapshotRow,
  ProfessionKnowledgeTreasureStatusRepositoryContract
} from "./profession-knowledge-treasure-status-repository.types.js";

export class FakeProfessionKnowledgeTreasureStatusRepository
  implements ProfessionKnowledgeTreasureStatusRepositoryContract
{
  private readonly characters: ProfessionKnowledgeTreasureCharacterRow[] =
    [];

  private readonly snapshots: ProfessionKnowledgeTreasureSnapshotRow[] =
    [];

  private readonly professionNames = new Map<
    string,
    string
  >();

  seedCharacter(
    row: Omit<
      ProfessionKnowledgeTreasureCharacterRow,
      "professionKeys"
    > & {
      professionKeys?: string[];
    }
  ) {
    this.characters.push({
      professionKeys: [],
      ...row
    });
  }

  seedSnapshot(row: ProfessionKnowledgeTreasureSnapshotRow) {
    this.snapshots.push(row);
  }

  seedProfessionName(key: string, name: string) {
    this.professionNames.set(key, name);
  }

  async findCharacters() {
    return this.characters;
  }

  async findSnapshots(definitionIds: string[]) {
    return this.snapshots.filter((row) =>
      definitionIds.includes(row.definitionId)
    );
  }

  async findProfessionNamesByKeys(professionKeys: string[]) {
    const result = new Map<string, string>();

    for (const key of professionKeys) {
      const name = this.professionNames.get(key);

      if (name) {
        result.set(key, name);
      }
    }

    return result;
  }
}
