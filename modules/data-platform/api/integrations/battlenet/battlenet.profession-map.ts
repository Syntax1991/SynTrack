const professionKeyByBattleNetId = new Map<number, string>([
  [164, "blacksmithing"],
  [165, "leatherworking"],
  [171, "alchemy"],
  [182, "herbalism"],
  [186, "mining"],
  [197, "tailoring"],
  [202, "engineering"],
  [333, "enchanting"],
  [393, "skinning"],
  [755, "jewelcrafting"],
  [773, "inscription"]
]);

export function getProfessionKeyByBattleNetId(
  professionId: number
): string | null {
  return (
    professionKeyByBattleNetId.get(professionId) ??
    null
  );
}

/*
 * Blizzard's stable numeric tier.id for the Midnight profession tier, by
 * profession.id - live-verified (2026-09-04) directly from real tracked
 * characters' Blizzard Professions API responses, never guessed:
 *   Alchemy (171) -> 2906 (Synblast)
 *   Leatherworking (165) -> 2915 (Synblast)
 *   Engineering (202) -> 2910 (Synbeast)
 *   Tailoring (197) -> 2918 (Synbeast)
 * Only professions SynTrack had a real tracked character for at the time
 * could be verified this way - the remaining 7 catalog professions
 * (blacksmithing, herbalism, mining, tailoring's siblings enchanting,
 * skinning, jewelcrafting, inscription) have no confirmed id and are
 * deliberately left out rather than guessed; callers must fall back to
 * the highest-tier-id heuristic for anything not listed here (see
 * blizzard-professions.normalizer.ts's resolveCurrentTier).
 */
const midnightTierIdByProfessionId = new Map<number, number>([
  [171, 2906],
  [165, 2915],
  [202, 2910],
  [197, 2918]
]);

export function getKnownMidnightTierId(
  professionId: number
): number | null {
  return midnightTierIdByProfessionId.get(professionId) ?? null;
}