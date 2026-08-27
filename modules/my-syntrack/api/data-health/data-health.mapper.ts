import type {
  CharacterDataHealth,
  DomainHealthState,
  ProfessionHealthEntry
} from "./data-health.types.js";

/*
 * The freshness boundary reuses the existing weekly/reset period
 * (getWeeklyPeriod) - no separate rolling-window math is introduced.
 * "Captured during the current period" -> FRESH; before it -> STALE;
 * never captured at all -> NEVER_CAPTURED.
 */
export function resolveTimestampFreshness(
  lastSyncedAt: Date | null,
  periodStartsAt: Date
):
  | "FRESH"
  | "STALE"
  | "NEVER_CAPTURED" {
  if (lastSyncedAt === null) {
    return "NEVER_CAPTURED";
  }

  return lastSyncedAt >= periodStartsAt
    ? "FRESH"
    : "STALE";
}

/*
 * Character identity freshness only applies to addon/Battle.net
 * sourced characters - a MANUAL character was never meant to be
 * addon-synced, so it is never counted as stale/never-captured.
 */
export function resolveCharacterHealth(
  source: string,
  lastSyncedAt: Date | null,
  periodStartsAt: Date
): DomainHealthState {
  if (source === "MANUAL") {
    return "MANUAL";
  }

  return resolveTimestampFreshness(
    lastSyncedAt,
    periodStartsAt
  );
}

/*
 * Each assigned profession is evaluated independently (never the
 * character's single newest profession-progress timestamp) - the
 * overall state is only FRESH/STALE/NEVER_CAPTURED when every
 * profession agrees; any disagreement, including one profession fresh
 * and another never captured, is conservatively PARTIAL.
 */
export function aggregateProfessionHealth(
  items: ProfessionHealthEntry[]
): DomainHealthState {
  if (items.length === 0) {
    return "NOT_TRACKED";
  }

  const states = new Set(
    items.map((item) => item.state)
  );

  if (states.size === 1) {
    return [...states][0]!;
  }

  return "PARTIAL";
}

/*
 * Gear is entirely manual today (no addon capture path exists yet) -
 * a character with zero gear rows is NOT_TRACKED (nothing entered),
 * one with only manually-entered rows (no lastSyncedAt) is MANUAL,
 * never a fabricated FRESH/STALE. Only once a real capture timestamp
 * exists does this evaluate against the freshness boundary, so a
 * future addon Gear-capture phase needs no change here.
 */
export function resolveGearHealth(
  trackedSlotCount: number,
  maxLastSyncedAt: Date | null,
  periodStartsAt: Date
): DomainHealthState {
  if (trackedSlotCount === 0) {
    return "NOT_TRACKED";
  }

  if (maxLastSyncedAt === null) {
    return "MANUAL";
  }

  return resolveTimestampFreshness(
    maxLastSyncedAt,
    periodStartsAt
  );
}

/*
 * The character's OWN addon-sync state is the honest "needs another
 * login" signal - a MANUAL-only character (never meant to be
 * addon-tracked) is deliberately excluded, never flagged forever.
 */
export function characterNeedsRefresh(
  health: CharacterDataHealth
): boolean {
  return (
    health.character.state ===
      "STALE" ||
    health.character.state ===
      "NEVER_CAPTURED"
  );
}
