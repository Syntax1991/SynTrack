import type { CharacterProfileAuthorityService } from "./character-profile-authority.service.js";

export type CharacterIdentityLookupInput = {
  id: string;
  name: string;
  realm: string;
  region: string;
  level: number;
  className: string;
};

export type EffectiveCharacterIdentity = {
  level: number;
  className: string;
};

/*
 * Phase F3: the reusable public-identity resolver every real level/class
 * consumer should share, instead of each service re-reading the raw
 * Character row on its own. Wraps CharacterProfileAuthorityService's
 * existing BLIZZARD-primary/ADDON-fallback policy (see that service's own
 * doc comment) - this file adds no new precedence rules, it only avoids
 * duplicating the per-character call site across every consumer.
 *
 * Only level/className are exposed here because those are the only two
 * public profile fields every non-Overview consumer in this audit
 * actually renders. Overview/Character-Detail need the fuller profile
 * (race/faction/activeSpec/guild/item level) and keep calling
 * CharacterProfileAuthorityService directly via overview-profile-effective.ts,
 * which this helper does not replace.
 */
export async function resolveEffectiveCharacterIdentities(
  characters: CharacterIdentityLookupInput[],
  profileAuthorityService: CharacterProfileAuthorityService
): Promise<Map<string, EffectiveCharacterIdentity>> {
  const entries = await Promise.all(
    characters.map(async (character) => {
      const authoritative = await profileAuthorityService.getAuthoritativeProfile(
        character.id,
        {
          name: character.name,
          realm: character.realm,
          region: character.region,
          level: character.level,
          className: character.className
        }
      );

      return [
        character.id,
        { level: authoritative.level, className: authoritative.class }
      ] as const;
    })
  );

  return new Map(entries);
}
