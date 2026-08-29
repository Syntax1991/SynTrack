/*
 * Midnight Season 2 (Tier 36) class set IDs — only these count as current
 * Tier. Same-expansion Season 1 sets (e.g. Evoker Black Talon 1981) must
 * never contribute to Overview SET.
 *
 * Proven from live Gear schemaVersion 2 captures + item names:
 *  2058 Evoker  Echo of Calamity
 *  2062 Paladin Radiance of the Consecrated Flame
 *  2063 Priest  Cosmic Penitent's Raiment
 *  2065 Shaman  Ophidian Oracle's Prophecy
 *  2061 Monk    Monkey King's Fighting Fists (Synmist bag, 2026-08-30)
 *
 * Add further class set IDs here as they are confirmed from live captures.
 * Scope key matches TrackerScopeProfile MIDNIGHT-S2.
 */
export const ACTIVE_TIER_SEASON_SCOPE_KEY = "MIDNIGHT-S2";

export const ACTIVE_TIER_SET_IDS: ReadonlySet<number> = new Set([
  2058, // Evoker - Echo of Calamity
  2061, // Monk - Monkey King (Ra-den S2)
  2062, // Paladin - Consecrated Flame
  2063, // Priest - Cosmic Penitent
  2065 // Shaman - Ophidian Oracle
]);

export function isActiveSeasonTierSetId(setId: number | null): boolean {
  return setId !== null && ACTIVE_TIER_SET_IDS.has(setId);
}
