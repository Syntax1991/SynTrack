import { describe, expect, it } from "vitest";
import {
  getClassColor,
  getClassInitials,
  getCraftStatusGlyph,
  getFamilyGlyph
} from "./professionIcons.helpers";

describe("getClassColor", () => {
  it("resolves the exact official color for a known class", () => {
    expect(
      getClassColor("Shaman")
    ).toBe("#0070DE");
  });

  it("falls back to a neutral color for an unrecognized class name, never guessing a nearby class's color", () => {
    expect(
      getClassColor("Sha")
    ).not.toBe(
      getClassColor("Shaman")
    );

    expect(
      getClassColor(
        "Not A Real Class"
      )
    ).toBe("#6b6b7a");
  });

  it("is exact-match only, not case-insensitive or partial", () => {
    expect(
      getClassColor("shaman")
    ).toBe("#6b6b7a");
  });
});

describe("getClassInitials", () => {
  it("builds initials from each word, capped at two characters", () => {
    expect(
      getClassInitials(
        "Death Knight"
      )
    ).toBe("DK");

    expect(
      getClassInitials("Shaman")
    ).toBe("S");
  });
});

describe("getFamilyGlyph", () => {
  it("resolves the curated glyph for a known family/category", () => {
    expect(
      getFamilyGlyph("Mail")
    ).toBe("M");
  });

  it("falls back to the name's own first two letters for an unrecognized category, never a curated glyph from a different category", () => {
    expect(
      getFamilyGlyph("Unknown")
    ).toBe("UN");

    expect(
      getFamilyGlyph("Unknown")
    ).not.toBe(
      getFamilyGlyph("Mail")
    );
  });
});

describe("getCraftStatusGlyph", () => {
  it("resolves the exact glyph per known craft status", () => {
    expect(
      getCraftStatusGlyph("SAFE")
    ).toBe("✓");

    expect(
      getCraftStatusGlyph(
        "NOT_SAFE"
      )
    ).toBe("✕");
  });

  it("falls back to a neutral glyph for an unrecognized status", () => {
    expect(
      getCraftStatusGlyph(
        "SOMETHING_ELSE"
      )
    ).toBe("?");
  });
});
