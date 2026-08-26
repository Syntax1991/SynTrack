import type { CharacterTrackerState } from "../types/overview.types";
import type { CellToken } from "./overviewCellFormatting";

const maxTextTokenLength = 10;

/*
 * UNKNOWN (no value row) is always "?" - explicitly distinct from a
 * real recorded FALSE ("○"), matching the three-state BOOLEAN
 * requirement (UNKNOWN / FALSE / TRUE are never collapsed).
 */
export function formatTrackerToken(
  trackerState: CharacterTrackerState | undefined
): CellToken {
  if (
    !trackerState ||
    trackerState.state === "UNKNOWN" ||
    !trackerState.value
  ) {
    return {
      symbol: "?",
      tone: "unknown",
      title: "Not recorded yet"
    };
  }

  const { value } = trackerState;

  if (value.valueType === "BOOLEAN") {
    return value.boolean
      ? {
          symbol: "✓",
          tone: "ready",
          title: "Complete"
        }
      : {
          symbol: "○",
          tone: "attention",
          title: "Explicitly incomplete"
        };
  }

  if (value.valueType === "PROGRESS") {
    return {
      symbol: `${value.current}/${value.total}`,
      tone:
        value.current >= value.total
          ? "ready"
          : "progress",
      title: `${value.current} of ${value.total}`
    };
  }

  if (value.valueType === "NUMBER") {
    return {
      symbol: String(value.number),
      tone: "progress",
      title: String(value.number)
    };
  }

  const truncated =
    value.text.length >
    maxTextTokenLength
      ? `${value.text.slice(0, maxTextTokenLength)}…`
      : value.text;

  return {
    symbol: truncated,
    tone: "progress",
    title: value.text
  };
}
