export type CharacterSyncRow = {
  characterId: string;
  source: string;
  lastSyncedAt: Date | null;
};

export type ProfessionAssignmentRow = {
  characterProfessionId: string;
  characterId: string;
  professionId: string;
  professionName: string;
};

export type GearSlotSummaryRow = {
  characterId: string;
  trackedSlotCount: number;
  maxLastSyncedAt: Date | null;
};

export type ResourceSnapshotSummaryRow = {
  characterId: string;
  trackedResourceCount: number;
  maxCapturedAt: Date | null;
};

/*
 * One row per (character, profession) that has at least one captured
 * source this period - a profession with zero enabled definitions
 * never produces a row at all (NOT_APPLICABLE, not NEVER_CAPTURED).
 */
export type ProfessionWeeklySnapshotHealthRow = {
  characterId: string;
  professionKey: string;
  capturedAt: Date;
};

export interface DataHealthRepositoryContract {
  findCharacterSync(
    characterIds: string[]
  ): Promise<CharacterSyncRow[]>;
  findProfessionAssignments(
    characterIds: string[]
  ): Promise<
    ProfessionAssignmentRow[]
  >;
  findProfessionMaxSync(
    characterProfessionIds: string[]
  ): Promise<
    Map<string, Date | null>
  >;
  findGearSlotSummary(
    characterIds: string[]
  ): Promise<GearSlotSummaryRow[]>;
  findResourceSnapshotSummary(
    characterIds: string[]
  ): Promise<ResourceSnapshotSummaryRow[]>;
  findProfessionWeeklySnapshots(
    characterIds: string[],
    periodKey: string
  ): Promise<ProfessionWeeklySnapshotHealthRow[]>;
}
