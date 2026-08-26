import { describe, expect, it } from "vitest";
import {
  trackerDefinitionCreateSchema,
  trackerDefinitionMetadataUpdateSchema
} from "./tracker-definition.validation.js";

describe("trackerDefinitionCreateSchema", () => {
  it("accepts a valid create payload", () => {
    expect(() =>
      trackerDefinitionCreateSchema.parse(
        {
          scopeKey: "MIDNIGHT-S1",
          key: "world-tour",
          name: "World Tour",
          valueType: "BOOLEAN",
          resetBehavior: "WEEKLY"
        }
      )
    ).not.toThrow();
  });

  it("rejects an unknown valueType", () => {
    expect(() =>
      trackerDefinitionCreateSchema.parse(
        {
          scopeKey: "MIDNIGHT-S1",
          key: "world-tour",
          name: "World Tour",
          valueType: "OPTION",
          resetBehavior: "WEEKLY"
        }
      )
    ).toThrow();
  });

  it("rejects an unknown resetBehavior (e.g. the removed MANUAL)", () => {
    expect(() =>
      trackerDefinitionCreateSchema.parse(
        {
          scopeKey: "MIDNIGHT-S1",
          key: "world-tour",
          name: "World Tour",
          valueType: "BOOLEAN",
          resetBehavior: "MANUAL"
        }
      )
    ).toThrow();
  });

  it("rejects unrecognized extra fields (strict)", () => {
    expect(() =>
      trackerDefinitionCreateSchema.parse(
        {
          scopeKey: "MIDNIGHT-S1",
          key: "world-tour",
          name: "World Tour",
          valueType: "BOOLEAN",
          resetBehavior: "WEEKLY",
          periodKey: "2026-08-26"
        }
      )
    ).toThrow();
  });
});

describe("trackerDefinitionMetadataUpdateSchema", () => {
  it("accepts a partial metadata update", () => {
    expect(() =>
      trackerDefinitionMetadataUpdateSchema.parse(
        { isPinned: false }
      )
    ).not.toThrow();
  });

  it("does not allow mutating identity or type fields (scopeKey/key/valueType/resetBehavior are not part of this schema at all)", () => {
    const parsed =
      trackerDefinitionMetadataUpdateSchema.parse(
        { name: "Renamed" }
      );

    expect(
      "scopeKey" in parsed
    ).toBe(false);
    expect("key" in parsed).toBe(
      false
    );
    expect(
      "valueType" in parsed
    ).toBe(false);
    expect(
      "resetBehavior" in parsed
    ).toBe(false);
  });

  it("rejects unrecognized extra fields, including an attempted valueType change", () => {
    expect(() =>
      trackerDefinitionMetadataUpdateSchema.parse(
        { valueType: "TEXT" }
      )
    ).toThrow();
  });
});
