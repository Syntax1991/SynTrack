/*
 * Pure derivation from raw CharacterResourceSnapshot fields - never
 * persisted, recomputed on every read. UNKNOWN > WRONG: any derivation
 * whose required operand is null returns null (not zero, not false).
 */

export function deriveWeeklyRemaining(
  weeklyQuantity: number | null,
  maxWeeklyQuantity: number | null
): number | null {
  if (weeklyQuantity === null || maxWeeklyQuantity === null) {
    return null;
  }

  return Math.max(maxWeeklyQuantity - weeklyQuantity, 0);
}

/*
 * Blizzard's own dedicated isWeeklyCapped evidence (from
 * PlayerHasMaxWeeklyQuantity) is authoritative and preferred outright -
 * it correctly sidesteps the "0 means unlimited" ambiguity a raw
 * quantity/cap comparison can't. Only falls back to comparing
 * weeklyQuantity against maxWeeklyQuantity when that dedicated evidence
 * itself is unavailable.
 */
export function deriveWeeklyComplete(
  isWeeklyCapped: boolean | null,
  weeklyQuantity: number | null,
  maxWeeklyQuantity: number | null
): boolean | null {
  if (isWeeklyCapped !== null) {
    return isWeeklyCapped;
  }

  if (weeklyQuantity === null || maxWeeklyQuantity === null) {
    return null;
  }

  return weeklyQuantity >= maxWeeklyQuantity;
}

/*
 * Only a PROVEN incomplete weekly resource counts as needing attention -
 * an unknown weekly state is never treated as a problem (that would be
 * guessing "wrong" from "unknown").
 */
export function deriveAttentionNeeded(
  weeklyComplete: boolean | null
): boolean {
  return weeklyComplete === false;
}
