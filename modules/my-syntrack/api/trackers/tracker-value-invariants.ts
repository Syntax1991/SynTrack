import { AppError } from "../../../../apps/api/src/shared/errors/AppError.js";
import type {
  TrackerNormalizedValue,
  TrackerValueInput,
  TrackerValueType
} from "./tracker.types.js";

export type TrackerValueColumns = {
  booleanValue: boolean | null;
  progressCurrent: number | null;
  progressTotal: number | null;
  numberValue: number | null;
  textValue: string | null;
};

const emptyColumns: TrackerValueColumns =
  {
    booleanValue: null,
    progressCurrent: null,
    progressTotal: null,
    numberValue: null,
    textValue: null
  };

/*
 * Validates one write payload against the owning definition's valueType
 * and returns the exact DB column shape to persist - every column not
 * relevant to this valueType is explicitly null, never left over from a
 * previous value. This is the one place "only the field appropriate to
 * valueType is populated" is enforced.
 */
export function buildTrackerValueColumns(
  valueType: TrackerValueType,
  input: TrackerValueInput
): TrackerValueColumns {
  if (input.valueType !== valueType) {
    throw new AppError(
      400,
      `This tracker expects a ${valueType} value, received ${input.valueType}.`
    );
  }

  if (valueType === "BOOLEAN") {
    if (
      input.valueType !== "BOOLEAN" ||
      typeof input.boolean !== "boolean"
    ) {
      throw new AppError(
        400,
        "A boolean tracker value is required."
      );
    }

    return {
      ...emptyColumns,
      booleanValue: input.boolean
    };
  }

  if (valueType === "PROGRESS") {
    if (input.valueType !== "PROGRESS") {
      throw new AppError(
        400,
        "A progress tracker value is required."
      );
    }

    const {
      current,
      total
    } = input;

    if (
      !Number.isInteger(current) ||
      current < 0
    ) {
      throw new AppError(
        400,
        "Progress current must be a whole number of 0 or more."
      );
    }

    if (
      !Number.isInteger(total) ||
      total <= 0
    ) {
      throw new AppError(
        400,
        "Progress total must be a whole number greater than 0."
      );
    }

    if (current > total) {
      throw new AppError(
        400,
        "Progress current cannot exceed progress total."
      );
    }

    return {
      ...emptyColumns,
      progressCurrent: current,
      progressTotal: total
    };
  }

  if (valueType === "NUMBER") {
    if (
      input.valueType !== "NUMBER" ||
      !Number.isInteger(input.number)
    ) {
      throw new AppError(
        400,
        "A whole-number tracker value is required."
      );
    }

    return {
      ...emptyColumns,
      numberValue: input.number
    };
  }

  if (
    input.valueType !== "TEXT" ||
    input.text.trim().length === 0
  ) {
    throw new AppError(
      400,
      "A non-empty text tracker value is required - use the clear operation to remove a value instead of sending empty text."
    );
  }

  return {
    ...emptyColumns,
    textValue: input.text.trim()
  };
}

/*
 * The read-side inverse: a persisted row (always written through
 * buildTrackerValueColumns, so exactly one group of columns is
 * populated) becomes one normalized, typed value.
 */
export function mapTrackerValueColumnsToNormalizedValue(
  valueType: TrackerValueType,
  row: TrackerValueColumns
): TrackerNormalizedValue | null {
  if (
    valueType === "BOOLEAN" &&
    row.booleanValue !== null
  ) {
    return {
      valueType: "BOOLEAN",
      boolean: row.booleanValue
    };
  }

  if (
    valueType === "PROGRESS" &&
    row.progressCurrent !== null &&
    row.progressTotal !== null
  ) {
    return {
      valueType: "PROGRESS",
      current: row.progressCurrent,
      total: row.progressTotal
    };
  }

  if (
    valueType === "NUMBER" &&
    row.numberValue !== null
  ) {
    return {
      valueType: "NUMBER",
      number: row.numberValue
    };
  }

  if (
    valueType === "TEXT" &&
    row.textValue !== null
  ) {
    return {
      valueType: "TEXT",
      text: row.textValue
    };
  }

  return null;
}
