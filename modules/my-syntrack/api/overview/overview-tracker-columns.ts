import type { TrackerDefinitionView } from "./overview.types.js";

/*
 * A tracker definition becomes a visible matrix column only when it is
 * BOTH pinned and enabled - unpinned trackers exist (and remain
 * manageable/readable) without cluttering the Overview; disabled
 * trackers keep their history readable elsewhere but never appear as
 * an active column, matching the same "disabled stays readable, never
 * hidden, but rejects new normal activity" posture used for definition
 * writes.
 */
export function filterPinnedTrackerColumns(
  definitions: TrackerDefinitionView[]
): TrackerDefinitionView[] {
  return definitions.filter(
    (definition) =>
      definition.isPinned &&
      definition.enabled
  );
}
