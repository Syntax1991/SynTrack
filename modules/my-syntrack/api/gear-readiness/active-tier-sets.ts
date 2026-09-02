/*
 * Midnight Season 2 (Tier 36) class set IDs — only these count as current
 * Tier. Same-expansion Season 1 sets (e.g. Evoker Black Talon 1981) must
 * never contribute to Overview SET or Season TIER.
 *
 * Verified from Wowhead item-set pages + live Gear schemaVersion 2 captures:
 *  2055 Death Knight  Baleful Grave-Knight's Crucible
 *  2056 Demon Hunter  Abyssal Doomhound's Pursuit
 *  2057 Druid         Bark of the Enigmatic Dreamwatcher (live Synbloom)
 *  2058 Evoker        Echo of Calamity
 *  2059 Hunter        Skulking Viper's Ambush
 *  2060 Mage          Primal Leywarden's Attire
 *  2061 Monk          Guile of the Monkey King / Monkey King's Fighting Fists
 *  2062 Paladin       Radiance of the Consecrated Flame
 *  2063 Priest        Cosmic Penitent's Raiment
 *  2064 Rogue         Chosen Bloodslayer's Hexweave
 *  2065 Shaman        Ophidian Oracle's Prophecy (live Synblast)
 *  2066 Warlock       Damned Necrolyte's Shattered Restraints
 *  2067 Warrior       Jade Warlord's Dominion
 *
 * Scope key matches TrackerScopeProfile MIDNIGHT-S2.
 */
export const ACTIVE_TIER_SEASON_SCOPE_KEY = "MIDNIGHT-S2";

export const ACTIVE_TIER_SET_IDS: ReadonlySet<number> = new Set([
  2055, // Death Knight
  2056, // Demon Hunter
  2057, // Druid
  2058, // Evoker
  2059, // Hunter
  2060, // Mage
  2061, // Monk
  2062, // Paladin
  2063, // Priest
  2064, // Rogue
  2065, // Shaman
  2066, // Warlock
  2067 // Warrior
]);

export function isActiveSeasonTierSetId(setId: number | null): boolean {
  return setId !== null && ACTIVE_TIER_SET_IDS.has(setId);
}
