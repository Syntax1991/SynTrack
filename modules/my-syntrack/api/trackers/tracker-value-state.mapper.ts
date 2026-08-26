import { mapTrackerValueColumnsToNormalizedValue } from "./tracker-value-invariants.js";
import type {
  CharacterTrackerState,
  TrackerValueType
} from "./tracker.types.js";

type RawTrackerValueRow = {
  booleanValue: boolean | null;
  progressCurrent: number | null;
  progressTotal: number | null;
  numberValue: number | null;
  textValue: string | null;
  source: string;
};

/*
 * No row for (definition, character, periodKey) = UNKNOWN, never a
 * false/zero/empty default - this is the one place that distinction is
 * made, so every consumer reads a real "RECORDED" | "UNKNOWN" state
 * instead of inferring meaning from four nullable columns.
 */
export function mapToCharacterTrackerState(
  trackerDefinitionId: string,
  characterId: string,
  periodKey: string,
  valueType: TrackerValueType,
  row: RawTrackerValueRow | null
): CharacterTrackerState {
  if (!row) {
    return {
      trackerDefinitionId,
      characterId,
      periodKey,
      state: "UNKNOWN",
      source: null,
      value: null
    };
  }

  return {
    trackerDefinitionId,
    characterId,
    periodKey,
    state: "RECORDED",
    source: row.source,
    value:
      mapTrackerValueColumnsToNormalizedValue(
        valueType,
        row
      )
  };
}
