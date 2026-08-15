export function formatSeconds(
  totalSeconds: number
): string {
  const minutes = Math.floor(
    totalSeconds / 60
  );

  const seconds = Math.floor(
    totalSeconds % 60
  );

  return `${minutes}:${String(
    seconds
  ).padStart(2, "0")}`;
}

export function parseTimeInput(
  value: string
): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const parts = trimmed.split(":");

  if (parts.length === 1) {
    const seconds = Number(
      parts[0]
    );

    return Number.isFinite(seconds)
      ? Math.max(
          0,
          Math.round(seconds)
        )
      : null;
  }

  if (parts.length === 2) {
    const minutes = Number(
      parts[0]
    );

    const seconds = Number(
      parts[1]
    );

    if (
      !Number.isFinite(minutes) ||
      !Number.isFinite(seconds)
    ) {
      return null;
    }

    return Math.max(
      0,
      Math.round(
        minutes * 60 + seconds
      )
    );
  }

  return null;
}

export function percentOf(
  seconds: number,
  planningDurationSeconds: number
): number {
  if (planningDurationSeconds <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (seconds /
        planningDurationSeconds) *
        100
    )
  );
}

export function secondsFromClickX(
  clientX: number,
  trackElement: HTMLElement,
  planningDurationSeconds: number
): number {
  const rect =
    trackElement.getBoundingClientRect();

  if (rect.width === 0) {
    return 0;
  }

  const ratio = Math.min(
    1,
    Math.max(
      0,
      (clientX - rect.left) /
        rect.width
    )
  );

  return Math.round(
    ratio * planningDurationSeconds
  );
}

export function formatRelativeTime(
  isoTimestamp: string,
  now: Date = new Date()
): string {
  const thenMs = new Date(
    isoTimestamp
  ).getTime();

  const diffSeconds = Math.max(
    0,
    Math.round(
      (now.getTime() - thenMs) / 1000
    )
  );

  if (diffSeconds < 60) {
    return "just now";
  }

  const diffMinutes = Math.floor(
    diffSeconds / 60
  );

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(
    diffMinutes / 60
  );

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(
    diffHours / 24
  );

  return `${diffDays}d ago`;
}

export function groupCastsByAbility<
  T extends {
    abilityName: string;
    timestampSeconds: number;
  }
>(
  casts: T[]
): Array<{ abilityName: string; casts: T[] }> {
  const order: string[] = [];
  const byAbility = new Map<string, T[]>();

  for (const cast of [...casts].sort(
    (a, b) =>
      a.timestampSeconds -
      b.timestampSeconds
  )) {
    if (!byAbility.has(cast.abilityName)) {
      byAbility.set(
        cast.abilityName,
        []
      );
      order.push(cast.abilityName);
    }

    byAbility
      .get(cast.abilityName)
      ?.push(cast);
  }

  return order.map((abilityName) => ({
    abilityName,
    casts:
      byAbility.get(abilityName) ?? []
  }));
}

/**
 * A member with an existing cooldown assignment can fall out of the
 * current boss lineup (benched, or removed from the Setup pool)
 * without their assignment ever being deleted. This distinguishes
 * that state so the row can render with a warning instead of
 * silently looking like a normal, still-eligible raider.
 */
export function isAssignedMemberInLineup(
  memberId: string,
  lineupMemberIds: Set<string>
): boolean {
  return lineupMemberIds.has(
    memberId
  );
}

/**
 * The Cooldown Planner's coordinate-system width — everything on the
 * timeline (ticks, markers, playhead, drag, phase segments) positions
 * against this, NOT against any single synced Warcraft Logs pull's
 * real duration. A short WCL pull must never shrink the planning
 * workspace; a real, longer or shorter `RaidBoss.fightDurationSeconds`
 * stays around as separate source metadata and is never written over
 * by this value. Fixed at 7:00 for the current product phase; a
 * proper reference-fight/encounter-duration workflow is future work.
 */
export const planningDurationSeconds = 420;

export type DerivedPhaseSegment = {
  label: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
};

/**
 * Phase timing is never manually entered — it's derived from real
 * phase-transition timestamps only (today: officer-added
 * RaidBossPhaseMarker rows; Warcraft Logs exposes no phase/stage data
 * for this app to prefer instead). A phase's end is simply the next
 * phase's start; the final phase ends at the planning horizon. No
 * markers at all means no segments — never fabricate a P1/P2/P3 split
 * that isn't backed by real data.
 *
 * Once at least one real marker exists, the span from 0 up to that
 * first marker is real, un-ambiguous time that must still render as
 * part of the phase bar — it's implicitly "Phase 1", the one phase
 * every encounter has before its first real transition. This is
 * deterministic construction from real transition timestamps, not
 * guessing a transition: only the marker's own timestamps decide
 * where boundaries fall.
 */
export function derivePhaseSegments(
  phaseMarkers: Array<{
    label: string;
    startSeconds: number;
  }>,
  planningDurationSeconds: number
): DerivedPhaseSegment[] {
  if (phaseMarkers.length === 0) {
    return [];
  }

  const sorted = [...phaseMarkers].sort(
    (a, b) =>
      a.startSeconds - b.startSeconds
  );

  const segments: DerivedPhaseSegment[] =
    [];

  if (sorted[0].startSeconds > 0) {
    segments.push({
      label: "Phase 1",
      startSeconds: 0,
      endSeconds:
        sorted[0].startSeconds,
      durationSeconds:
        sorted[0].startSeconds
    });
  }

  sorted.forEach((marker, index) => {
    const nextMarker =
      sorted[index + 1];

    const endSeconds = nextMarker
      ? nextMarker.startSeconds
      : planningDurationSeconds;

    segments.push({
      label: marker.label,
      startSeconds:
        marker.startSeconds,
      endSeconds,
      durationSeconds: Math.max(
        0,
        endSeconds -
          marker.startSeconds
      )
    });
  });

  return segments;
}

/**
 * `phase.start <= timestamp < phase.end`, so a cast lands in exactly
 * one segment. A timestamp before the first real marker has no
 * derivable phase (never guessed); a timestamp at or past the last
 * boundary (e.g. exactly at the fight's end) resolves to the final
 * segment rather than falling through.
 */
export function resolveActivePhase(
  timestampSeconds: number,
  segments: DerivedPhaseSegment[]
): DerivedPhaseSegment | null {
  for (const segment of segments) {
    if (
      timestampSeconds >=
        segment.startSeconds &&
      timestampSeconds <
        segment.endSeconds
    ) {
      return segment;
    }
  }

  const lastSegment =
    segments[segments.length - 1];

  if (
    lastSegment &&
    timestampSeconds >=
      lastSegment.startSeconds
  ) {
    return lastSegment;
  }

  return null;
}

export function getWowIconUrl(
  icon: string
): string {
  const fileName = icon.endsWith(
    ".jpg"
  )
    ? icon
    : `${icon}.jpg`;

  return `https://wow.zamimg.com/images/wow/icons/medium/${fileName}`;
}
