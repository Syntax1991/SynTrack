import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { WeeklyGameplayRepository } from "./weekly-gameplay.repository.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

export type MythicPlusSeasonDungeonBest = {
  mapChallengeModeId: number;
  bestKeyLevel: number;
};

/**
 * Current-season, per-dungeon best-timed-level facts for one Character.
 * `captured: false` covers both "never synced" and "raw evidence could not
 * be safely attributed to a dungeon" — callers must treat both as UNKNOWN,
 * never as zero.
 */
export type MythicPlusSeasonProgress = {
  captured: boolean;
  dungeonBests: MythicPlusSeasonDungeonBest[];
};

const UNCAPTURED: MythicPlusSeasonProgress = {
  captured: false,
  dungeonBests: []
};

function progressFromSnapshot(
  snapshot: WeeklyGameplaySnapshotInput | undefined
): MythicPlusSeasonProgress {
  if (!snapshot || !snapshot.mythicPlusCaptured) {
    return UNCAPTURED;
  }

  const bestByDungeon = new Map<number, number>();

  for (const run of snapshot.mythicPlusRuns) {
    if (run.mapChallengeModeId === null || run.mapChallengeModeId === undefined) {
      // Can't safely attribute this run to a dungeon — don't guess.
      return UNCAPTURED;
    }

    const existing = bestByDungeon.get(run.mapChallengeModeId) ?? 0;
    if (run.keyLevel > existing) {
      bestByDungeon.set(run.mapChallengeModeId, run.keyLevel);
    }
  }

  return {
    captured: true,
    dungeonBests: [...bestByDungeon.entries()].map(
      ([mapChallengeModeId, bestKeyLevel]) => ({
        mapChallengeModeId,
        bestKeyLevel
      })
    )
  };
}

/**
 * Shared read model over the addon's `C_MythicPlus.GetRunHistory(true, true)`
 * capture (current-season, best-per-dungeon already, regardless of which
 * week the run happened in). Physically stored in the weekly-period-keyed
 * gameplay snapshot, but the FACT itself is season-scoped, not weekly —
 * this service is the one place that bridges the two so consumers like
 * Season never need to know about weekly periods at all.
 *
 * Only the CURRENT week's snapshot is trusted: if a Character hasn't synced
 * this week, there's no way to prove an older snapshot hasn't rolled into a
 * new season, so it's reported as uncaptured (UNKNOWN) rather than assumed
 * still valid.
 */
export class MythicPlusSeasonProgressService {
  constructor(
    private readonly repository: WeeklyGameplayRepository = new WeeklyGameplayRepository()
  ) {}

  async getForCharacters(
    characterIds: string[]
  ): Promise<Map<string, MythicPlusSeasonProgress>> {
    if (characterIds.length === 0) {
      return new Map();
    }

    const period = getWeeklyPeriod();
    const snapshots = await this.repository.findSnapshotsForPeriod(period.key);
    const snapshotByCharacterId = new Map(
      snapshots.map((snapshot) => [snapshot.characterId, snapshot] as const)
    );

    return new Map(
      characterIds.map((characterId) => [
        characterId,
        progressFromSnapshot(snapshotByCharacterId.get(characterId))
      ])
    );
  }
}
