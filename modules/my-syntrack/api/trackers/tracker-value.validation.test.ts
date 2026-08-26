import { describe, expect, it } from "vitest";
import { trackerValueSetSchema } from "./tracker-value.validation.js";

describe("trackerValueSetSchema", () => {
  it("accepts a valid BOOLEAN payload", () => {
    expect(() =>
      trackerValueSetSchema.parse({
        valueType: "BOOLEAN",
        boolean: false
      })
    ).not.toThrow();
  });

  it("accepts a valid PROGRESS payload", () => {
    expect(() =>
      trackerValueSetSchema.parse({
        valueType: "PROGRESS",
        current: 2,
        total: 4
      })
    ).not.toThrow();
  });

  it("accepts a valid NUMBER payload", () => {
    expect(() =>
      trackerValueSetSchema.parse({
        valueType: "NUMBER",
        number: 658
      })
    ).not.toThrow();
  });

  it("accepts a valid TEXT payload", () => {
    expect(() =>
      trackerValueSetSchema.parse({
        valueType: "TEXT",
        text: "MYTH"
      })
    ).not.toThrow();
  });

  it("rejects a PROGRESS payload shaped as BOOLEAN", () => {
    expect(() =>
      trackerValueSetSchema.parse({
        valueType: "PROGRESS",
        boolean: true
      })
    ).toThrow();
  });

  it("rejects a payload with no recognized valueType", () => {
    expect(() =>
      trackerValueSetSchema.parse({
        boolean: true
      })
    ).toThrow();
  });

  it("never accepts a client-supplied periodKey on a normal write payload - the backend always resolves it", () => {
    expect(() =>
      trackerValueSetSchema.parse({
        valueType: "BOOLEAN",
        boolean: true,
        periodKey: "2026-08-26"
      })
    ).toThrow();
  });
});
