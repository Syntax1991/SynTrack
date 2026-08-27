import { getWeeklyPeriod } from "../shared/weekly-period.js";
import type { DataHealthRepositoryContract } from "./data-health-repository.types.js";
import {
  aggregateProfessionHealth,
  resolveCharacterHealth,
  resolveGearHealth,
  resolveResourceHealth,
  resolveTimestampFreshness
} from "./data-health.mapper.js";
import type { CharacterDataHealth } from "./data-health.types.js";

/*
 * Data Health is a pure read model composed from timestamps that
 * already exist on Character/CharacterGearSlot/
 * CharacterProfessionNodeProgress - it persists nothing, and every
 * domain here is resolved independently so a character never leaks
 * another character's freshness signal.
 */
export class DataHealthService {
  constructor(
    private readonly repository: DataHealthRepositoryContract
  ) {}

  async getHealthByCharacterIds(
    characterIds: string[],
    now = new Date()
  ): Promise<
    Map<string, CharacterDataHealth>
  > {
    if (characterIds.length === 0) {
      return new Map();
    }

    const periodStartsAt = new Date(
      getWeeklyPeriod(now).startsAt
    );

    const [
      characterSyncRows,
      professionAssignments,
      gearSlotSummaries,
      resourceSnapshotSummaries
    ] = await Promise.all([
      this.repository.findCharacterSync(
        characterIds
      ),
      this.repository.findProfessionAssignments(
        characterIds
      ),
      this.repository.findGearSlotSummary(
        characterIds
      ),
      this.repository.findResourceSnapshotSummary(
        characterIds
      )
    ]);

    const professionMaxSyncByAssignmentId =
      await this.repository.findProfessionMaxSync(
        professionAssignments.map(
          (assignment) =>
            assignment.characterProfessionId
        )
      );

    const characterSyncById = new Map(
      characterSyncRows.map((row) => [
        row.characterId,
        row
      ])
    );

    const gearSummaryById = new Map(
      gearSlotSummaries.map((row) => [
        row.characterId,
        row
      ])
    );

    const resourceSummaryById = new Map(
      resourceSnapshotSummaries.map((row) => [
        row.characterId,
        row
      ])
    );

    const assignmentsByCharacterId =
      new Map<
        string,
        typeof professionAssignments
      >();

    for (const assignment of professionAssignments) {
      const existing =
        assignmentsByCharacterId.get(
          assignment.characterId
        ) ?? [];

      existing.push(assignment);

      assignmentsByCharacterId.set(
        assignment.characterId,
        existing
      );
    }

    const healthByCharacterId = new Map<
      string,
      CharacterDataHealth
    >();

    for (const characterId of characterIds) {
      const syncRow =
        characterSyncById.get(
          characterId
        );

      const characterState =
        resolveCharacterHealth(
          syncRow?.source ?? "MANUAL",
          syncRow?.lastSyncedAt ??
            null,
          periodStartsAt
        );

      const assignments =
        assignmentsByCharacterId.get(
          characterId
        ) ?? [];

      const professionItems =
        assignments.map(
          (assignment) => {
            const maxSync =
              professionMaxSyncByAssignmentId.get(
                assignment.characterProfessionId
              ) ?? null;

            return {
              professionId:
                assignment.professionId,
              name: assignment.professionName,
              state:
                resolveTimestampFreshness(
                  maxSync,
                  periodStartsAt
                ),
              lastSyncedAt:
                maxSync?.toISOString() ??
                null
            };
          }
        );

      const gearSummary =
        gearSummaryById.get(
          characterId
        );

      const resourceSummary =
        resourceSummaryById.get(
          characterId
        );

      healthByCharacterId.set(
        characterId,
        {
          characterId,
          character: {
            state: characterState,
            lastSyncedAt:
              syncRow?.lastSyncedAt?.toISOString() ??
              null
          },
          professions: {
            state:
              aggregateProfessionHealth(
                professionItems
              ),
            items: professionItems
          },
          gear: {
            state: resolveGearHealth(
              gearSummary?.trackedSlotCount ??
                0,
              gearSummary?.maxLastSyncedAt ??
                null,
              periodStartsAt
            ),
            lastSyncedAt:
              gearSummary?.maxLastSyncedAt?.toISOString() ??
              null
          },
          resources: {
            state: resolveResourceHealth(
              resourceSummary?.trackedResourceCount ??
                0,
              resourceSummary?.maxCapturedAt ??
                null,
              periodStartsAt
            ),
            lastSyncedAt:
              resourceSummary?.maxCapturedAt?.toISOString() ??
              null
          }
        }
      );
    }

    return healthByCharacterId;
  }
}
