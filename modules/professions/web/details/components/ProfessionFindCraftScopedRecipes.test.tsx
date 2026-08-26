import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfessionFindCraftScopedRecipes } from "./ProfessionFindCraftScopedRecipes";
import {
  createCrafter,
  mailWristRecipe
} from "./professionFindCraftBrowse.fixtures";

describe("ProfessionFindCraftScopedRecipes", () => {
  it("does not repeat the candidate's identity/specialization/compact-result when a recipe is clicked - only additional detail appears", () => {
    const crafter = createCrafter({
      characterId: "character-1",
      name: "Synjudge",
      craftStatus: "CONCENTRATION",
      recommendation: {
        kind: "UNKNOWN",
        craftStatus: "CONCENTRATION",
        effectiveSkill: 380,
        craftingQuality: 4,
        concentrationCost: 429,
        selections: []
      }
    });

    const recipe = mailWristRecipe(
      "Farstrider's Sharpened Claws",
      [crafter]
    );

    render(
      <ProfessionFindCraftScopedRecipes
        recipes={[recipe]}
      />
    );

    fireEvent.click(
      screen.getByText(
        "Farstrider's Sharpened Claws"
      )
    );

    expect(
      document.querySelector(
        ".profession-find-craft-browse-candidate-identity"
      )
    ).not.toBeInTheDocument();

    expect(
      document.querySelector(
        ".profession-crafter-specialization"
      )
    ).not.toBeInTheDocument();

    /*
     * The recipe ROW itself legitimately keeps its own inline compact
     * result (preserved per the earlier task) - that's one occurrence,
     * from the row, not from this additional-detail block repeating it.
     */
    const additionalDetail =
      document.querySelector(
        ".profession-find-craft-recipe-additional-detail"
      ) as HTMLElement;

    expect(
      additionalDetail
    ).toBeInTheDocument();

    expect(
      additionalDetail.querySelector(
        ".profession-crafter-craft-cell"
      )
    ).not.toBeInTheDocument();
  });

  it("shows the recipe's additional detail (family/slot and per-crafter material+result) once a recipe is selected", () => {
    const crafter = createCrafter({
      characterId: "character-1",
      name: "Synjudge"
    });

    const recipe = mailWristRecipe(
      "Farstrider's Sharpened Claws",
      [crafter]
    );

    render(
      <ProfessionFindCraftScopedRecipes
        recipes={[recipe]}
      />
    );

    fireEvent.click(
      screen.getByText(
        "Farstrider's Sharpened Claws"
      )
    );

    expect(
      screen.getByText(
        "Mail · Wrist"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Synjudge")
    ).toBeInTheDocument();
  });
});
