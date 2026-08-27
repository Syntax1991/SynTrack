import { describe, expect, it } from "vitest";
import { parseItemLink } from "./addon-import.item-link.normalizer.js";

describe("parseItemLink", () => {
  it("extracts itemId, enchantId, and gem ids from a full item string", () => {
    const result = parseItemLink(
      "item:12345:6789:111:222:333::0:0:80"
    );

    expect(result).toEqual({
      itemId: 12345,
      enchantId: 6789,
      gemIds: [111, 222, 333]
    });
  });

  it("treats a missing enchant field as no enchant", () => {
    const result = parseItemLink("item:12345::::::0:0:80");

    expect(result.itemId).toBe(12345);
    expect(result.enchantId).toBeNull();
    expect(result.gemIds).toEqual([]);
  });

  it("treats a single gem correctly", () => {
    const result = parseItemLink("item:12345:0:111::::0:0:80");

    expect(result.gemIds).toEqual([111]);
  });

  it("treats multiple gems correctly", () => {
    const result = parseItemLink("item:12345:0:111:222:333::0:0:80");

    expect(result.gemIds).toEqual([111, 222, 333]);
  });

  it("tolerates modern links with empty fields instead of zeros", () => {
    const result = parseItemLink("item:12345::::::::");

    expect(result.itemId).toBe(12345);
    expect(result.enchantId).toBeNull();
    expect(result.gemIds).toEqual([]);
  });

  it("tolerates omitted trailing fields entirely", () => {
    const result = parseItemLink("item:12345:6789");

    expect(result.itemId).toBe(12345);
    expect(result.enchantId).toBe(6789);
    expect(result.gemIds).toEqual([]);
  });

  it("parses the item string out of a full hyperlink wrapper", () => {
    const result = parseItemLink(
      "|cffa335ee|Hitem:12345:6789:111::::0:0:80::::::|h[Test Item]|h|r"
    );

    expect(result.itemId).toBe(12345);
    expect(result.enchantId).toBe(6789);
    expect(result.gemIds).toEqual([111]);
  });

  it("returns all-null/empty for a malformed link instead of throwing", () => {
    expect(() =>
      parseItemLink("not-an-item-link")
    ).not.toThrow();

    const result = parseItemLink("not-an-item-link");

    expect(result).toEqual({
      itemId: null,
      enchantId: null,
      gemIds: []
    });
  });

  it("returns all-null/empty for null input", () => {
    expect(parseItemLink(null)).toEqual({
      itemId: null,
      enchantId: null,
      gemIds: []
    });
  });

  it("returns all-null/empty for an item string with a non-numeric itemId", () => {
    const result = parseItemLink("item:abc:6789");

    expect(result).toEqual({
      itemId: null,
      enchantId: null,
      gemIds: []
    });
  });

  it("never reports a zero gem id as a real gem", () => {
    const result = parseItemLink("item:12345:0:0:0:0:0:0:0:80");

    expect(result.enchantId).toBeNull();
    expect(result.gemIds).toEqual([]);
  });
});
