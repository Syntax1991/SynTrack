import { describe, expect, it } from "vitest";
import { resolveAssignmentCategory } from "./cooldownCategories.js";

describe("resolveAssignmentCategory", () => {
  it("resolves a catalogued spellId to its real category", () => {
    expect(
      resolveAssignmentCategory({
        spellId: 97462
      })
    ).toBe("Raid DR");
  });

  it("resolves a free-text assignment (no spellId) to Other", () => {
    expect(
      resolveAssignmentCategory({
        spellId: null
      })
    ).toBe("Other");
  });

  it("resolves an uncatalogued spellId to Other rather than guessing", () => {
    expect(
      resolveAssignmentCategory({
        spellId: 999999999
      })
    ).toBe("Other");
  });
});
