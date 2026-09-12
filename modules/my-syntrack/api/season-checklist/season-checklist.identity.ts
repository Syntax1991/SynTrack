import { resolveCharacterTrackingProfile } from "../character-tracking/character-tracking-profile.js";
import type { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import { resolveEffectiveCharacterIdentities } from "../character-external-sync/character-profile-effective-identity.js";
import type { TagView } from "../tags/tag.types.js";

export type SeasonChecklistCharacterRow = {
  id: string;
  name: string;
  realm: string;
  region: string;
  className: string;
  level: number;
};

/*
 * Phase F3: Season Checklist's own roster used to read className/level
 * straight off the Character row. Resolves the same BLIZZARD-primary/
 * ADDON-fallback identity every other real consumer now shares - split out
 * of season-checklist.service.ts to stay under the 350-line architecture cap.
 */
export async function resolveActiveSeasonCharacters(
  characters: SeasonChecklistCharacterRow[],
  tagsByCharacterId: Map<string, TagView[]>,
  profileAuthorityService: CharacterProfileAuthorityService
) {
  const identityByCharacterId = await resolveEffectiveCharacterIdentities(
    characters,
    profileAuthorityService
  );

  // Active SynTrack Characters only (RemovedCharacter rows are deleted
  // from Character). Warband evidence uses this full roster; the Season
  // Character table still filters to gameplay-applicable Characters.
  return characters.map((character) => {
    const trackingProfile = resolveCharacterTrackingProfile(
      tagsByCharacterId.get(character.id) ?? []
    );
    const identity = identityByCharacterId.get(character.id);

    return {
      id: character.id,
      name: character.name,
      realm: character.realm,
      region: character.region,
      className: identity?.className ?? character.className,
      level: identity?.level ?? character.level,
      trackingProfile
    };
  });
}
