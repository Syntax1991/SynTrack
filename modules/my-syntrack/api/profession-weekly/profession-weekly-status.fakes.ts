import type {
  ProfessionWeeklyCharacterRow,
  ProfessionWeeklySnapshotRow,
  ProfessionWeeklyStatusRepositoryContract
} from "./profession-weekly-status-repository.types.js";

export class FakeProfessionWeeklyStatusRepository
  implements ProfessionWeeklyStatusRepositoryContract
{
  private readonly characters: ProfessionWeeklyCharacterRow[] =
    [];

  private readonly snapshots: ProfessionWeeklySnapshotRow[] =
    [];

  private readonly professionNames = new Map<
    string,
    string
  >();

  seedCharacter(
    row: Omit<ProfessionWeeklyCharacterRow, "professionKeys"> & {
      professionKeys?: string[];
    }
  ) {
    this.characters.push({
      professionKeys: [],
      ...row
    });
  }

  seedSnapshot(row: ProfessionWeeklySnapshotRow) {
    this.snapshots.push(row);
  }

  seedProfessionName(key: string, name: string) {
    this.professionNames.set(key, name);
  }

  async findCharacters() {
    return this.characters;
  }

  async findSnapshotsForPeriod(
    sourceDefinitionIds: string[],
    _periodKey: string
  ) {
    return this.snapshots.filter((row) =>
      sourceDefinitionIds.includes(
        row.sourceDefinitionId
      )
    );
  }

  async findProfessionNamesByKeys(
    professionKeys: string[]
  ) {
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
