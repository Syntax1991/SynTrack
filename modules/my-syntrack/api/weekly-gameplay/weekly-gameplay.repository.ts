import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

export class WeeklyGameplayRepository {
  async findSnapshotsForPeriod(
    periodKey: string
  ): Promise<WeeklyGameplaySnapshotInput[]> {
    const rows = await prisma.characterWeeklyGameplaySnapshot.findMany({
      where: { periodKey },
      include: {
        vaultActivities: true,
        mythicPlusRuns: true,
        raidLockouts: true
      }
    });

    return rows.map((row) => ({
      characterId: row.characterId,
      vaultCaptured: row.vaultCaptured,
      vaultCurrentPeriod: row.vaultCurrentPeriod,
      mythicPlusCaptured: row.mythicPlusCaptured,
      raidCaptured: row.raidCaptured,
      vaultActivities: row.vaultActivities.map((activity) => ({
        typeName: activity.typeName,
        threshold: activity.threshold,
        progress: activity.progress
      })),
      mythicPlusRuns: row.mythicPlusRuns.map((run) => ({
        keyLevel: run.keyLevel,
        completed: run.completed,
        thisWeek: run.thisWeek
      })),
      raidLockouts: row.raidLockouts.map((lockout) => ({
        instanceName: lockout.instanceName,
        encounterProgress: lockout.encounterProgress,
        numEncounters: lockout.numEncounters,
        encountersJson: lockout.encountersJson
      }))
    }));
  }
}
