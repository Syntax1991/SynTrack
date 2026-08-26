import { describe, expect, it } from "vitest";
import { computeBrowseCandidates } from "./professionFindCraftBrowse.helpers";
import {
  createCrafter,
  mailWristRecipe
} from "./professionFindCraftBrowse.fixtures";
import { filterRecipesByQuality } from "../utils/professionItemQuality.helpers";

describe("computeBrowseCandidates", () => {
  it("scopes known-recipe counts to only the recipes passed in (the selected family+slot)", () => {
    const synblast =
      createCrafter({
        characterId: "character-1",
        name: "Synblast"
      });

    const recipeOne =
      mailWristRecipe("Recipe One", [
        synblast
      ]);

    const recipeTwo =
      mailWristRecipe("Recipe Two", [
        synblast
      ]);

    const candidates =
      computeBrowseCandidates([
        recipeOne,
        recipeTwo
      ]);

    expect(candidates).toEqual([
      expect.objectContaining({
        characterId: "character-1",
        characterName: "Synblast",
        knownRecipeCount: 2
      })
    ]);
  });

  it("candidate recipe counts reflect the quality-filtered recipe set - a character does not keep credit for a recipe Epic-only excluded", () => {
    const synblast =
      createCrafter({
        characterId: "character-1",
        name: "Synblast"
      });

    const epicRecipe =
      mailWristRecipe(
        "Epic Recipe",
        [synblast],
        "EPIC"
      );

    const rareRecipe =
      mailWristRecipe(
        "Rare Recipe",
        [synblast],
        "RARE"
      );

    const unfiltered =
      computeBrowseCandidates([
        epicRecipe,
        rareRecipe
      ]);

    expect(
      unfiltered[0]
        ?.knownRecipeCount
    ).toBe(2);

    const epicOnlyRecipes =
      filterRecipesByQuality(
        [epicRecipe, rareRecipe],
        "EPIC"
      );

    const epicOnlyCandidates =
      computeBrowseCandidates(
        epicOnlyRecipes
      );

    expect(
      epicOnlyCandidates[0]
        ?.knownRecipeCount
    ).toBe(1);
  });

  it("does not hide a recipe-known character merely because they lack a representative alignment - specialization is resolved separately", () => {
    const synfel =
      createCrafter({
        characterId: "character-2",
        name: "Synfel"
      });

    const recipe =
      mailWristRecipe(
        "Scout's Scaled Bracers",
        [synfel]
      );

    const candidates =
      computeBrowseCandidates([
        recipe
      ]);

    expect(
      candidates.map(
        (candidate) =>
          candidate.characterName
      )
    ).toEqual(["Synfel"]);
  });
});
