import { CharacterExternalSnapshotRepository } from "../character-external-sync/character-external-snapshot.repository.js";
import {
  EXTERNAL_DOMAIN_MYTHIC_PLUS,
  EXTERNAL_SOURCE_BLIZZARD
} from "../character-external-sync/character-external-sync.types.js";
import type { NormalizedBlizzardMythicPlusPayload } from "../character-external-sync/character-external-sync.types.js";
import { getWeeklyPeriod } from "../shared/weekly-period.js";
import { WeeklyGameplayRepository } from "./weekly-gameplay.repository.js";
import type { WeeklyGameplaySnapshotInput } from "./weekly-gameplay.types.js";

export type MythicPlusSeasonDungeonBest = {
  mapChallengeModeId: number;
  bestKeyLevel: number;
};

/**
 * Current-season, per-dungeon best-TIMED-level facts for one Character.
 * `captured: false` covers "never synced"/"raw evidence could not be
 * safely attributed to a dungeon" — callers must treat both as UNKNOWN,
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

/*
 * M+ season data can move as new personal bests are set - same
 * volatility/threshold reasoning already used for the MYTHIC_PLUS domain
 * elsewhere (CharacterMythicPlusAuthorityService).
 */
const BLIZZARD_SEASON_STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/*
 * Phase D.2 bug fix: Resilient Keystone's own product copy, tests, and
 * doc comments all describe this as requiring dungeons to be TIMED
 * ("Highest Keystone floor unlocked by timing all 8 current-season
 * dungeons..." - season-goal-definitions.ts; "treats an untimed dungeon
 * as below 12, never as unknown" - season-checklist.resilient.test.ts).
 * The addon's `completed` field (from C_MythicPlus.GetRunHistory) was
 * empirically proven, not assumed, to mean exactly "completed within the
 * time limit": cross-referencing every real completed=false row for a
 * live tracked character against Blizzard's own is_completed_within_time
 * data (via the Web API's season resource) matched on EXACT duration for
 * every one of 5 independent runs, with zero counter-examples (Phase
 * D.2's audit). Filtering on `completed === true` here (previously
 * unfiltered - a real, confirmed bug, not a design choice) is therefore
 * a correctness fix, not a behavior change to preserve.
 */
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

    if (run.completed !== true) {
      // Not proven timed - never counts toward a "best timed" floor.
      continue;
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

/*
 * Blizzard's season/{id} resource, filtered to completedInTime===true and
 * grouped to the per-dungeon max keystoneLevel - live-verified (Phase
 * D.1/D.2) to be genuinely season-wide (contains dungeons/runs absent
 * from current_period) and numerically identical, for a real character,
 * to the addon's own (now-fixed) timed-only season capture. Deliberately
 * does NOT read current_period - Phase D.1 proved that is WEEKLY-scoped,
 * not season-wide, and must never feed a season goal. Deliberately does
 * not read any Great Vault activity/threshold model at all - this stays
 * a read of the BLIZZARD MYTHIC_PLUS snapshot only.
 */
function progressFromBlizzardSeason(
  payload: NormalizedBlizzardMythicPlusPayload
): MythicPlusSeasonProgress | null {
  if (!payload.hasProfile) {
    return null;
  }

  const bestByDungeon = new Map<number, number>();

  for (const run of payload.season?.bestRuns ?? []) {
    if (run.completedInTime !== true) {
      continue;
    }

    if (run.dungeonId === null || run.keystoneLevel === null) {
      continue;
    }

    const existing = bestByDungeon.get(run.dungeonId) ?? 0;
    if (run.keystoneLevel > existing) {
      bestByDungeon.set(run.dungeonId, run.keystoneLevel);
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
 * Season-wide, per-dungeon best-TIMED-level read model for Resilient
 * Keystone. PRIMARY=BLIZZARD season/{id} data (fresh + a confirmed
 * profile), FALLBACK=the addon's own current-week-synced season capture.
 * Provider authority beats cross-provider freshness, matching every
 * other MYTHIC_PLUS consumer: a fresh Blizzard result is used even if an
 * addon sync happened more recently, and a stale/unconfirmed Blizzard
 * snapshot falls back to addon rather than serving stale season data
 * silently.
 *
 * The addon fallback path is unchanged architecturally: only the
 * CURRENT week's `CharacterWeeklyGameplaySnapshot` is trusted (if a
 * Character hasn't synced this week, there's no way to prove an older
 * snapshot hasn't rolled into a new season), reported as UNCAPTURED
 * rather than assumed still valid.
 */
export class MythicPlusSeasonProgressService {
  constructor(
    private readonly repository: WeeklyGameplayRepository = new WeeklyGameplayRepository(),
    private readonly snapshotRepository: CharacterExternalSnapshotRepository = new CharacterExternalSnapshotRepository()
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

    const entries = await Promise.all(
      characterIds.map(async (characterId) => {
        const blizzard = await this.getBlizzardSeasonProgress(characterId);

        return [
          characterId,
          blizzard ?? progressFromSnapshot(snapshotByCharacterId.get(characterId))
        ] as const;
      })
    );

    return new Map(entries);
  }

  private async getBlizzardSeasonProgress(
    characterId: string
  ): Promise<MythicPlusSeasonProgress | null> {
    const snapshot =
      await this.snapshotRepository.findOne<NormalizedBlizzardMythicPlusPayload>(
        characterId,
        EXTERNAL_SOURCE_BLIZZARD,
        EXTERNAL_DOMAIN_MYTHIC_PLUS
      );

    const hasSuccessfulSnapshot =
      snapshot !== null &&
      snapshot.payload !== null &&
      snapshot.fetchedAt !== null;

    if (!hasSuccessfulSnapshot) {
      return null;
    }

    const isStale =
      Date.now() - snapshot.fetchedAt!.getTime() >
      BLIZZARD_SEASON_STALE_THRESHOLD_MS;

    if (isStale) {
      return null;
    }

    return progressFromBlizzardSeason(snapshot.payload!);
  }
}
