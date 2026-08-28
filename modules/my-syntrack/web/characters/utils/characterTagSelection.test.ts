import { describe, expect, it } from "vitest";
import { computeBulkTagState } from "./characterTagSelection";

describe("computeBulkTagState", () => {
  it("returns NONE when no selected character has the tag", () => {
    const map = new Map([
      ["char-1", new Set(["tag-b"])],
      ["char-2", new Set<string>()]
    ]);

    expect(
      computeBulkTagState(
        "tag-a",
        new Set(["char-1", "char-2"]),
        map
      )
    ).toBe("NONE");
  });

  it("returns ALL when every selected character has the tag", () => {
    const map = new Map([
      ["char-1", new Set(["tag-a"])],
      ["char-2", new Set(["tag-a"])]
    ]);

    expect(
      computeBulkTagState(
        "tag-a",
        new Set(["char-1", "char-2"]),
        map
      )
    ).toBe("ALL");
  });

  it("returns SOME when only some selected characters have the tag", () => {
    const map = new Map([
      ["char-1", new Set(["tag-a"])],
      ["char-2", new Set<string>()]
    ]);

    expect(
      computeBulkTagState(
        "tag-a",
        new Set(["char-1", "char-2"]),
        map
      )
    ).toBe("SOME");
  });

  it("returns NONE for an empty selection", () => {
    expect(
      computeBulkTagState(
        "tag-a",
        new Set(),
        new Map()
      )
    ).toBe("NONE");
  });

  it("treats a character with no map entry as not having the tag", () => {
    expect(
      computeBulkTagState(
        "tag-a",
        new Set(["char-1"]),
        new Map()
      )
    ).toBe("NONE");
  });
});
