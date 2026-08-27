import type {
  CharacterSyncRow,
  DataHealthRepositoryContract,
  GearSlotSummaryRow,
  ProfessionAssignmentRow
} from "./data-health-repository.types.js";

export class FakeDataHealthRepository
  implements DataHealthRepositoryContract
{
  private characterSyncRows: CharacterSyncRow[] =
    [];

  private professionAssignmentRows: ProfessionAssignmentRow[] =
    [];

  private professionMaxSync = new Map<
    string,
    Date | null
  >();

  private gearSlotSummaryRows: GearSlotSummaryRow[] =
    [];

  seedCharacterSync(
    row: CharacterSyncRow
  ) {
    this.characterSyncRows.push(row);
  }

  seedProfessionAssignment(
    row: ProfessionAssignmentRow,
    maxSync: Date | null
  ) {
    this.professionAssignmentRows.push(
      row
    );

    this.professionMaxSync.set(
      row.characterProfessionId,
      maxSync
    );
  }

  seedGearSlotSummary(
    row: GearSlotSummaryRow
  ) {
    this.gearSlotSummaryRows.push(row);
  }

  async findCharacterSync(
    characterIds: string[]
  ) {
    return this.characterSyncRows.filter(
      (row) =>
        characterIds.includes(
          row.characterId
        )
    );
  }

  async findProfessionAssignments(
    characterIds: string[]
  ) {
    return this.professionAssignmentRows.filter(
      (row) =>
        characterIds.includes(
          row.characterId
        )
    );
  }

  async findProfessionMaxSync(
    characterProfessionIds: string[]
  ) {
    const result = new Map<
      string,
      Date | null
    >();

    for (const id of characterProfessionIds) {
      result.set(
        id,
        this.professionMaxSync.get(
          id
        ) ?? null
      );
    }

    return result;
  }

  async findGearSlotSummary(
    characterIds: string[]
  ) {
    return this.gearSlotSummaryRows.filter(
      (row) =>
        characterIds.includes(
          row.characterId
        )
    );
  }
}
