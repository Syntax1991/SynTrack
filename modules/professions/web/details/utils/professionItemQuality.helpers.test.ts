import { describe, expect, it } from "vitest";
import {
  filterRecipesByQuality,
  getItemQualityColor,
  getItemQualityLabel,
  matchesQualityFilter
} from "./professionItemQuality.helpers";

describe("getItemQualityColor / getItemQualityLabel", () => {
  it("maps Blizzard's exact Rare quality to Rare - color and label", () => {
    expect(
      getItemQualityColor("RARE")
    ).toBe("#0070dd");

    expect(
      getItemQualityLabel("RARE")
    ).toBe("Rare");
  });

  it("maps Blizzard's exact Epic quality to Epic - color and label", () => {
    expect(
      getItemQualityColor("EPIC")
    ).toBe("#a335ee");

    expect(
      getItemQualityLabel("EPIC")
    ).toBe("Epic");
  });

  it("never maps Rare's color/label to Epic's, or vice versa", () => {
    expect(
      getItemQualityColor("RARE")
    ).not.toBe(
      getItemQualityColor("EPIC")
    );

    expect(
      getItemQualityLabel("RARE")
    ).not.toBe(
      getItemQualityLabel("EPIC")
    );
  });

  it("returns null for a recipe with no verified quality, never a guessed color/label", () => {
    expect(
      getItemQualityColor(null)
    ).toBeNull();

    expect(
      getItemQualityLabel(null)
    ).toBeNull();
  });
});

describe("matchesQualityFilter", () => {
  it("Epic-only accepts only an exact Epic quality match", () => {
    expect(
      matchesQualityFilter(
        { itemQuality: "EPIC" },
        "EPIC"
      )
    ).toBe(true);

    expect(
      matchesQualityFilter(
        { itemQuality: "RARE" },
        "EPIC"
      )
    ).toBe(false);

    expect(
      matchesQualityFilter(
        { itemQuality: "UNCOMMON" },
        "EPIC"
      )
    ).toBe(false);
  });

  it("Rare-only accepts only an exact Rare quality match", () => {
    expect(
      matchesQualityFilter(
        { itemQuality: "RARE" },
        "RARE"
      )
    ).toBe(true);

    expect(
      matchesQualityFilter(
        { itemQuality: "EPIC" },
        "RARE"
      )
    ).toBe(false);
  });

  it("a recipe with UNKNOWN/unresolved quality (null) never passes Epic-only or Rare-only, never assumed to be either", () => {
    expect(
      matchesQualityFilter(
        { itemQuality: null },
        "EPIC"
      )
    ).toBe(false);

    expect(
      matchesQualityFilter(
        { itemQuality: null },
        "RARE"
      )
    ).toBe(false);
  });

  it("ALL always passes, regardless of quality (including unresolved/null)", () => {
    expect(
      matchesQualityFilter(
        { itemQuality: "EPIC" },
        "ALL"
      )
    ).toBe(true);

    expect(
      matchesQualityFilter(
        { itemQuality: null },
        "ALL"
      )
    ).toBe(true);
  });
});

describe("filterRecipesByQuality", () => {
  function createRecipe(
    id: string,
    itemQuality: string | null
  ) {
    return {
      id,
      itemQuality
    } as never;
  }

  it("Browse/Search/By Character all filter through this one shared function - Epic-only removes Rare and unresolved recipes", () => {
    const recipes = [
      createRecipe(
        "epic-1",
        "EPIC"
      ),
      createRecipe(
        "rare-1",
        "RARE"
      ),
      createRecipe(
        "unresolved-1",
        null
      )
    ];

    const filtered =
      filterRecipesByQuality(
        recipes,
        "EPIC"
      );

    expect(
      filtered.map(
        (recipe) => recipe.id
      )
    ).toEqual(["epic-1"]);
  });

  it("does not filter anything when ALL is selected (the default)", () => {
    const recipes = [
      createRecipe(
        "epic-1",
        "EPIC"
      ),
      createRecipe(
        "rare-1",
        "RARE"
      )
    ];

    expect(
      filterRecipesByQuality(
        recipes,
        "ALL"
      )
    ).toHaveLength(2);
  });
});
