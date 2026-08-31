import { getWeeklyPeriod } from "../../../../my-syntrack/api/shared/weekly-period.js";
import type { AddonImportTransaction } from "./addon-import.persistence.types.js";
import type { AddonWeeklyActivitySnapshot } from "./addon-import.weekly-activity.types.js";

export class AddonWeeklyActivityPersistence {
  async persist(
    transaction: AddonImportTransaction,
    characterId: string,
    snapshot: AddonWeeklyActivitySnapshot | null,
    result: { weeklyGameplaySnapshots: number }
  ): Promise<void> {
    if (!snapshot) {
      return;
    }

    const periodKey = getWeeklyPeriod().key;
    const capturedAt = new Date();

    await transaction.characterWeeklyVaultActivity.deleteMany({
      where: {
        snapshot: {
          characterId,
          periodKey
        }
      }
    });
    await transaction.characterWeeklyMythicPlusCapture.deleteMany({
      where: {
        snapshot: {
          characterId,
          periodKey
        }
      }
    });
    await transaction.characterWeeklyRaidLockout.deleteMany({
      where: {
        snapshot: {
          characterId,
          periodKey
        }
      }
    });

    await transaction.characterWeeklyGameplaySnapshot.upsert({
      where: {
        characterId_periodKey: {
          characterId,
          periodKey
        }
      },
      create: {
        characterId,
        periodKey,
        capturedAt,
        vaultCaptured: snapshot.vaultCaptured,
        vaultGenerated: snapshot.vaultGenerated,
        vaultCurrentPeriod: snapshot.vaultCurrentPeriod,
        vaultCanClaim: snapshot.vaultCanClaim,
        vaultHasAvailable: snapshot.vaultHasAvailable,
        mythicPlusCaptured: snapshot.mythicPlusCaptured,
        raidCaptured: snapshot.raidCaptured,
        vaultActivities: {
          create: snapshot.vaultActivities.map((activity) => ({
            type: activity.type,
            typeName: activity.typeName,
            index: activity.index,
            threshold: activity.threshold,
            progress: activity.progress,
            activityId: activity.activityId,
            level: activity.level,
            activityTierId: activity.activityTierId,
            claimId: activity.claimId
          }))
        },
        mythicPlusRuns: {
          create: snapshot.mythicPlusRuns.map((run) => ({
            mapChallengeModeId: run.mapChallengeModeId,
            keyLevel: run.keyLevel,
            completed: run.completed,
            thisWeek: run.thisWeek,
            durationSec: run.durationSec,
            dungeonScore: run.dungeonScore
          }))
        },
        raidLockouts: {
          create: snapshot.raids.map((raid) => ({
            instanceName: raid.name,
            difficulty: raid.difficulty,
            difficultyName: raid.difficultyName,
            encounterProgress: raid.encounterProgress,
            numEncounters: raid.numEncounters,
            encountersJson: JSON.stringify(raid.encounters)
          }))
        }
      },
      update: {
        capturedAt,
        vaultCaptured: snapshot.vaultCaptured,
        vaultGenerated: snapshot.vaultGenerated,
        vaultCurrentPeriod: snapshot.vaultCurrentPeriod,
        vaultCanClaim: snapshot.vaultCanClaim,
        vaultHasAvailable: snapshot.vaultHasAvailable,
        mythicPlusCaptured: snapshot.mythicPlusCaptured,
        raidCaptured: snapshot.raidCaptured,
        vaultActivities: {
          create: snapshot.vaultActivities.map((activity) => ({
            type: activity.type,
            typeName: activity.typeName,
            index: activity.index,
            threshold: activity.threshold,
            progress: activity.progress,
            activityId: activity.activityId,
            level: activity.level,
            activityTierId: activity.activityTierId,
            claimId: activity.claimId
          }))
        },
        mythicPlusRuns: {
          create: snapshot.mythicPlusRuns.map((run) => ({
            mapChallengeModeId: run.mapChallengeModeId,
            keyLevel: run.keyLevel,
            completed: run.completed,
            thisWeek: run.thisWeek,
            durationSec: run.durationSec,
            dungeonScore: run.dungeonScore
          }))
        },
        raidLockouts: {
          create: snapshot.raids.map((raid) => ({
            instanceName: raid.name,
            difficulty: raid.difficulty,
            difficultyName: raid.difficultyName,
            encounterProgress: raid.encounterProgress,
            numEncounters: raid.numEncounters,
            encountersJson: JSON.stringify(raid.encounters)
          }))
        }
      }
    });

    result.weeklyGameplaySnapshots += 1;
  }
}
