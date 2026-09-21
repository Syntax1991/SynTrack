import { describe, expect, it } from "vitest";
import {
  DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS,
  filterPublicCrafterShareCard,
  matchesPublicCrafterShareRecipe,
  parseMinItemLevel
} from "./crafterShareFilter";
import type { PublicCrafterShareRecipe } from "./types/crafterShare.types";

function recipe(
  overrides: Partial<PublicCrafterShareRecipe> = {}
): PublicCrafterShareRecipe {
  return {
    name: "Scout's Scaled Bracers",
    itemQuality: "EPIC",
    itemLevel: 331,
    iconUrl: "https://example.test/bracers.png",
    resultQuality: 5,
    craftStatus: "SAFE",
    slotName: "Mail Wrist",
    ...overrides
  };
}

describe("parseMinItemLevel", () => {
  it("reads a positive integer and ignores empty or invalid input", () => {
    expect(parseMinItemLevel("331")).toBe(331);
    expect(parseMinItemLevel("")).toBeNull();
    expect(parseMinItemLevel("abc")).toBeNull();
    expect(parseMinItemLevel("0")).toBeNull();
  });
});

describe("matchesPublicCrafterShareRecipe", () => {
  it("defaults to Rare and Epic so Uncommon greens do not pass", () => {
    expect(
      matchesPublicCrafterShareRecipe(
        recipe(),
        DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS
      )
    ).toBe(true);

    expect(
      matchesPublicCrafterShareRecipe(
        recipe({ itemQuality: "RARE", name: "Blood-Tempered Bracers" }),
        DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS
      )
    ).toBe(true);

    expect(
      matchesPublicCrafterShareRecipe(
        recipe({ itemQuality: "UNCOMMON", name: "Green Flask" }),
        DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS
      )
    ).toBe(false);
  });

  it("matches a name search regardless of casing", () => {
    expect(
      matchesPublicCrafterShareRecipe(recipe(), {
        ...DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS,
        query: "bracers"
      })
    ).toBe(true);

    expect(
      matchesPublicCrafterShareRecipe(recipe(), {
        ...DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS,
        query: "helm"
      })
    ).toBe(false);
  });

  it("hides recipes without a stored item level when a minimum is set", () => {
    expect(
      matchesPublicCrafterShareRecipe(recipe({ itemLevel: 331 }), {
        ...DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS,
        minItemLevel: 331
      })
    ).toBe(true);

    expect(
      matchesPublicCrafterShareRecipe(recipe({ itemLevel: 220 }), {
        ...DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS,
        minItemLevel: 331
      })
    ).toBe(false);

    expect(
      matchesPublicCrafterShareRecipe(recipe({ itemLevel: null }), {
        ...DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS,
        minItemLevel: 331
      })
    ).toBe(false);
  });
});

describe("filterPublicCrafterShareCard", () => {
  it("drops professions and characters that have no matching crafts", () => {
    const filtered = filterPublicCrafterShareCard(
      {
        battleTag: "Syn#1234",
        characters: [
          {
            name: "Synblast",
            realm: "Antonidas",
            className: "Shaman",
            professions: [
              {
                name: "Alchemy",
                recipes: [
                  recipe({
                    name: "Green Flask",
                    itemQuality: "UNCOMMON",
                    itemLevel: 90
                  })
                ]
              },
              {
                name: "Blacksmithing",
                recipes: [recipe()]
              }
            ]
          }
        ]
      },
      DEFAULT_PUBLIC_CRAFTER_SHARE_FILTERS
    );

    expect(filtered.characters).toHaveLength(1);
    expect(filtered.characters[0]?.professions.map((p) => p.name)).toEqual([
      "Blacksmithing"
    ]);
  });
});
