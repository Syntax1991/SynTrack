import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import type { CharacterWeeklyState } from "./overview.types.js";

/*
 * Phase F1 read-path integration: overrides the rendered className/level
 * with CharacterProfileAuthorityService's Blizzard-primary values
 * (falling back to the Character row's own addon/BattleNet-import-
 * written values whenever no fresh Blizzard PROFILE snapshot exists -
 * see CharacterProfileAuthorityService's own doc comment for why that
 * fallback is safe and why name/realm/region are never touched here).
 *
 * Applied as the LAST step before OverviewService.getOverview() returns,
 * specifically because GearReadinessService's own character rows (used
 * by the aggregator's `gearInput.level ?? character.level` precedence)
 * are a separate, unrelated read of the same Character row - overriding
 * only the base `characters` array before aggregation would have been
 * silently reverted by that precedence. This is the one place override
 * that is guaranteed not to be undone by anything downstream.
 *
 * Character.id/ownership/tags/tracked state/preferences/profession
 * assignments are never touched - only the two rendered display fields
 * this type actually exposes.
 */
export async function applyAuthoritativeProfile(
  characters: CharacterWeeklyState[],
  profileAuthorityService: CharacterProfileAuthorityService
): Promise<void> {
  await Promise.all(
    characters.map(async (entry) => {
      const authoritative = await profileAuthorityService.getAuthoritativeProfile(
        entry.character.id,
        {
          name: entry.character.name,
          realm: entry.character.realm,
          region: entry.character.region,
          level: entry.character.level,
          className: entry.character.className
        }
      );

      entry.character.level = authoritative.level;
      entry.character.className = authoritative.class;
    })
  );
}
