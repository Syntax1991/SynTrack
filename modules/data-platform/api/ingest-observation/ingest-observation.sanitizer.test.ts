import { describe, expect, it } from "vitest";
import { sanitizeIngestPayload } from "./ingest-observation.sanitizer.js";

describe("sanitizeIngestPayload", () => {
  it("redacts known secret-bearing keys at the top level", () => {
    const result = sanitizeIngestPayload({
      Authorization: "Bearer abc123",
      access_token: "abc123",
      client_secret: "shh",
      itemId: 271483
    });

    expect(result).toEqual({
      Authorization: "[REDACTED]",
      access_token: "[REDACTED]",
      client_secret: "[REDACTED]",
      itemId: 271483
    });
  });

  it("redacts secret-bearing keys at any nesting depth without touching sibling data", () => {
    const result = sanitizeIngestPayload({
      character: {
        name: "Synbeast",
        session: { token: "keep-this-visible-but-parent-key-is-what-matters" },
        equipped_items: [
          { item: { id: 219749 }, refresh_token: "nope" }
        ]
      }
    });

    expect(result).toEqual({
      character: {
        name: "Synbeast",
        session: "[REDACTED]",
        equipped_items: [
          { item: { id: 219749 }, refresh_token: "[REDACTED]" }
        ]
      }
    });
  });

  it("leaves ordinary game data completely untouched (no renaming, no value translation)", () => {
    const payload = {
      character: { id: 219749, level: 80, faction: "Horde" },
      equipped_item: [{ item: { id: 271483 }, slot: { type: "HEAD" } }]
    };

    expect(sanitizeIngestPayload(payload)).toEqual(payload);
  });

  it("passes through primitives and null unchanged", () => {
    expect(sanitizeIngestPayload("plain string")).toBe("plain string");
    expect(sanitizeIngestPayload(42)).toBe(42);
    expect(sanitizeIngestPayload(null)).toBeNull();
    expect(sanitizeIngestPayload(true)).toBe(true);
  });
});
