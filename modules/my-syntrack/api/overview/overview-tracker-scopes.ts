import type { TrackerDefinitionView } from "./overview.types.js";
import { filterPinnedTrackerColumns } from "./overview-tracker-columns.js";

/*
 * Matrix tracker columns combine the active season's pinned trackers
 * with GLOBAL's pinned trackers - GLOBAL survives every season switch
 * by definition, so it is unconditionally included regardless of
 * which season is currently active (or whether one is active at all).
 */
export function combinePinnedTrackerColumns(
  seasonalDefinitions: TrackerDefinitionView[],
  globalDefinitions: TrackerDefinitionView[]
): TrackerDefinitionView[] {
  return filterPinnedTrackerColumns([
    ...seasonalDefinitions,
    ...globalDefinitions
  ]);
}
