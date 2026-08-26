import { describe, expect, it } from "vitest";
import {
  buildTrackerValueColumns,
  mapTrackerValueColumnsToNormalizedValue
} from "./tracker-value-invariants.js";

describe("buildTrackerValueColumns - BOOLEAN", () => {
  it("stores true with every other typed field null", () => {
    const columns = buildTrackerValueColumns(
      "BOOLEAN",
      { valueType: "BOOLEAN", boolean: true }
    );

    expect(columns).toEqual({
      booleanValue: true,
      progressCurrent: null,
      progressTotal: null,
      numberValue: null,
      textValue: null
    });
  });

  it("stores false as a real explicit value, never treated as missing", () => {
    const columns = buildTrackerValueColumns(
      "BOOLEAN",
      { valueType: "BOOLEAN", boolean: false }
    );

    expect(columns.booleanValue).toBe(
      false
    );

    expect(
      columns.booleanValue
    ).not.toBeNull();
  });

  it("rejects a mismatched payload valueType", () => {
    expect(() =>
      buildTrackerValueColumns("BOOLEAN", {
        valueType: "TEXT",
        text: "x"
      })
    ).toThrow();
  });
});

describe("buildTrackerValueColumns - PROGRESS", () => {
  it("stores a valid 2/4 progress value", () => {
    const columns = buildTrackerValueColumns(
      "PROGRESS",
      {
        valueType: "PROGRESS",
        current: 2,
        total: 4
      }
    );

    expect(columns.progressCurrent).toBe(
      2
    );
    expect(columns.progressTotal).toBe(4);
    expect(
      columns.booleanValue
    ).toBeNull();
    expect(columns.numberValue).toBeNull();
    expect(columns.textValue).toBeNull();
  });

  it("rejects a negative current", () => {
    expect(() =>
      buildTrackerValueColumns(
        "PROGRESS",
        {
          valueType: "PROGRESS",
          current: -1,
          total: 4
        }
      )
    ).toThrow();
  });

  it("rejects a zero or negative total", () => {
    expect(() =>
      buildTrackerValueColumns(
        "PROGRESS",
        {
          valueType: "PROGRESS",
          current: 0,
          total: 0
        }
      )
    ).toThrow();
  });

  it("rejects current greater than total", () => {
    expect(() =>
      buildTrackerValueColumns(
        "PROGRESS",
        {
          valueType: "PROGRESS",
          current: 5,
          total: 4
        }
      )
    ).toThrow();
  });
});

describe("buildTrackerValueColumns - NUMBER", () => {
  it("stores a whole number with every other typed field null", () => {
    const columns = buildTrackerValueColumns(
      "NUMBER",
      { valueType: "NUMBER", number: 658 }
    );

    expect(columns.numberValue).toBe(658);
    expect(
      columns.booleanValue
    ).toBeNull();
    expect(
      columns.progressCurrent
    ).toBeNull();
    expect(columns.textValue).toBeNull();
  });
});

describe("buildTrackerValueColumns - TEXT", () => {
  it("stores trimmed text with every other typed field null", () => {
    const columns = buildTrackerValueColumns(
      "TEXT",
      {
        valueType: "TEXT",
        text: "  MYTH  "
      }
    );

    expect(columns.textValue).toBe(
      "MYTH"
    );
    expect(
      columns.booleanValue
    ).toBeNull();
    expect(columns.numberValue).toBeNull();
  });

  it("rejects empty/whitespace-only text - clearing is a separate, explicit operation", () => {
    expect(() =>
      buildTrackerValueColumns("TEXT", {
        valueType: "TEXT",
        text: "   "
      })
    ).toThrow();
  });
});

describe("mapTrackerValueColumnsToNormalizedValue", () => {
  it("round-trips a BOOLEAN false value without losing it", () => {
    const value =
      mapTrackerValueColumnsToNormalizedValue(
        "BOOLEAN",
        {
          booleanValue: false,
          progressCurrent: null,
          progressTotal: null,
          numberValue: null,
          textValue: null
        }
      );

    expect(value).toEqual({
      valueType: "BOOLEAN",
      boolean: false
    });
  });

  it("returns null when the relevant column for this valueType is empty", () => {
    const value =
      mapTrackerValueColumnsToNormalizedValue(
        "TEXT",
        {
          booleanValue: null,
          progressCurrent: null,
          progressTotal: null,
          numberValue: null,
          textValue: null
        }
      );

    expect(value).toBeNull();
  });
});
