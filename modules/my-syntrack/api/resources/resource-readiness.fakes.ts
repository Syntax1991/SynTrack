import type {
  ResourceCharacterRow,
  ResourceReadinessRepositoryContract,
  ResourceSnapshotRow
} from "./resource-readiness-repository.types.js";

export class FakeResourceReadinessRepository
  implements ResourceReadinessRepositoryContract
{
  private readonly characters: ResourceCharacterRow[] = [];
  private readonly snapshots: ResourceSnapshotRow[] = [];

  seedCharacter(row: ResourceCharacterRow) {
    this.characters.push(row);
  }

  seedSnapshot(
    row: Partial<ResourceSnapshotRow> & {
      characterId: string;
      resourceDefinitionId: string;
      capturedAt: Date;
    }
  ) {
    this.snapshots.push({
      quantity: row.quantity ?? null,
      maxQuantity: row.maxQuantity ?? null,
      weeklyQuantity: row.weeklyQuantity ?? null,
      maxWeeklyQuantity: row.maxWeeklyQuantity ?? null,
      isCapped: row.isCapped ?? null,
      isWeeklyCapped: row.isWeeklyCapped ?? null,
      discovered: row.discovered ?? null,
      accountWide: row.accountWide ?? null,
      ...row
    });
  }

  async findCharacters() {
    return this.characters;
  }

  async findSnapshotsByDefinitionIds(
    resourceDefinitionIds: string[]
  ) {
    return this.snapshots.filter((row) =>
      resourceDefinitionIds.includes(
        row.resourceDefinitionId
      )
    );
  }
}
