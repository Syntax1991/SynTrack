import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfessionFindCraftRecipeList } from "./ProfessionFindCraftRecipeList";
import {
  createCrafter,
  mailWristRecipe
} from "./professionFindCraftBrowse.fixtures";

describe("ProfessionFindCraftRecipeList", () => {
  it("renders the inline craft result summary directly in the recipe row - no click/expand required", () => {
    const recipe =
      mailWristRecipe(
        "Silvermoon Agent's Deflectors",
        [
          createCrafter({
            craftStatus: "SAFE",
            recommendation: {
              kind: "UNKNOWN",
              craftStatus: "SAFE",
              effectiveSkill: 380,
              craftingQuality: 5,
              concentrationCost: null,
              selections: []
            }
          })
        ]
      );

    render(
      <ProfessionFindCraftRecipeList
        onSelect={() => {}}
        recipes={[recipe]}
        selectedRecipeId={null}
      />
    );

    expect(
      screen.getAllByText(
        "Silvermoon Agent's Deflectors"
      ).length
    ).toBeGreaterThan(0);

    expect(
      screen.getByText(
        "Q5 · Skill 380"
      )
    ).toBeInTheDocument();
  });

  it("shows a concentration-cost summary instead of skill when the crafter needs Concentration", () => {
    const recipe =
      mailWristRecipe(
        "Smuggler's Leather Wristbands",
        [
          createCrafter({
            craftStatus:
              "CONCENTRATION",
            recommendation: {
              kind: "UNKNOWN",
              craftStatus:
                "CONCENTRATION",
              effectiveSkill: 350,
              craftingQuality: 5,
              concentrationCost: 429,
              selections: []
            }
          })
        ]
      );

    render(
      <ProfessionFindCraftRecipeList
        onSelect={() => {}}
        recipes={[recipe]}
        selectedRecipeId={null}
      />
    );

    expect(
      screen.getByText(
        "Q5 · 429 Conc"
      )
    ).toBeInTheDocument();
  });

  it("keeps the crafter count visible as secondary information alongside the result", () => {
    const recipe =
      mailWristRecipe(
        "Scout's Scaled Bracers",
        [
          createCrafter({
            characterId:
              "character-1"
          }),
          createCrafter({
            characterId:
              "character-2"
          })
        ]
      );

    render(
      <ProfessionFindCraftRecipeList
        onSelect={() => {}}
        recipes={[recipe]}
        selectedRecipeId={null}
      />
    );

    expect(
      screen.getByText("2 crafters")
    ).toBeInTheDocument();
  });

  it("renders no inline result summary for a recipe with no known crafters, rather than inventing one", () => {
    const recipe =
      mailWristRecipe(
        "Unknown Recipe",
        []
      );

    render(
      <ProfessionFindCraftRecipeList
        onSelect={() => {}}
        recipes={[recipe]}
        selectedRecipeId={null}
      />
    );

    expect(
      screen.getByText("0 crafters")
    ).toBeInTheDocument();

    expect(
      screen.queryByText(/^Q\d/)
    ).not.toBeInTheDocument();
  });
});
