/**
 * Declutters inline timestamp labels on a dense encounter row using
 * real measured pixel geometry, not a fixed seconds threshold — a
 * hardcoded seconds gap only happens to look right for one specific
 * track width/planning duration, and breaks the moment either changes.
 * `trackWidthPx` must be the row-track's actual measured rendered
 * width (e.g. via ResizeObserver); `minLabelPixelGap` is the minimum
 * pixel distance a label needs from the previously *shown* label to
 * avoid visually overlapping it. The marker/icon itself is never
 * hidden — only its adjacent text label is suppressed, and the
 * tooltip remains available regardless. Input timestamps must already
 * be sorted ascending (groupCastsByAbility already guarantees this
 * per ability).
 */
export function computeCastLabelVisibility(
  sortedTimestampsSeconds: number[],
  trackWidthPx: number,
  planningDurationSeconds: number,
  minLabelPixelGap = 32
): boolean[] {
  if (trackWidthPx <= 0) {
    return sortedTimestampsSeconds.map(
      () => false
    );
  }

  let lastShownX: number | null = null;

  return sortedTimestampsSeconds.map(
    (seconds) => {
      const x =
        (seconds /
          planningDurationSeconds) *
        trackWidthPx;

      if (
        lastShownX === null ||
        x - lastShownX >= minLabelPixelGap
      ) {
        lastShownX = x;
        return true;
      }

      return false;
    }
  );
}
