import { prisma } from "../../../../apps/api/src/infrastructure/database/prismaClient.js";
import { NON_WEEKLY_TRACKER_PERIOD_KEY } from "../trackers/tracker-period.js";
import { WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY } from "../weekly-checklist/weeklies-tracker-keys.js";

/*
 * The addon's own seasonal Mythic+ rating capture (WeekliesSignals.lua's
 * captureMythicPlusRating, already math.floor()'d before it reaches
 * SynTrack) - stored as a generic CharacterTrackerValue, resetBehavior
 * SEASONAL, hence the shared NON_WEEKLY_TRACKER_PERIOD_KEY sentinel
 * rather than a weekly period key. Read-only fallback lookup for
 * CharacterMythicPlusAuthorityService - never writes, and never touches
 * this tracker's value the way the addon import path does.
 */
export class CharacterMythicPlusAddonFallbackRepository {
  async findSeasonRating(characterId: string): Promise<number | null> {
    const value = await prisma.characterTrackerValue.findFirst({
      where: {
        characterId,
        periodKey: NON_WEEKLY_TRACKER_PERIOD_KEY,
        trackerDefinition: {
          key: WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
          enabled: true
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return value?.numberValue ?? null;
  }

  /*
   * When the addon itself last wrote this tracker value - used by the
   * Phase F1 corrective review's recency guard to detect when the addon
   * has observed a newer rating than Blizzard's last recorded login
   * reflects. A separate method (rather than widening findSeasonRating's
   * return shape) so existing callers of the number-only lookup are
   * unaffected.
   */
  async findSeasonRatingObservedAt(characterId: string): Promise<Date | null> {
    const value = await prisma.characterTrackerValue.findFirst({
      where: {
        characterId,
        periodKey: NON_WEEKLY_TRACKER_PERIOD_KEY,
        trackerDefinition: {
          key: WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
          enabled: true
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return value?.updatedAt ?? null;
  }
}
