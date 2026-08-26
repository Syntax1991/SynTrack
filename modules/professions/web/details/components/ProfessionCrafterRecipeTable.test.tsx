import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfessionCrafterRecipeTable } from "./ProfessionCrafterRecipeTable";
import type { ProfessionCrafterRecipeEntry } from "./ProfessionCrafterRecipeTable";
import {
  createCrafter,
  mailWristRecipe
} from "./professionFindCraftBrowse.fixtures";

/*
 * Regression check: By Character's own row component (a different
 * component from the shared Browse/Search recipe list) must keep
 * rendering its recipe name, product/type, specialization, and craft
 * result columns unaffected by the new inline-result work done to
 * ProfessionFindCraftRecipeList.
 */
describe("ProfessionCrafterRecipeTable (By Character - regression)", () => {
  it("still renders the recipe name and its craft result inline in the row", () => {
    const crafter = createCrafter({
      craftStatus: "SAFE",
      recommendation: {
        kind: "UNKNOWN",
        craftStatus: "SAFE",
        effectiveSkill: 380,
        craftingQuality: 5,
        concentrationCost: null,
        selections: []
      }
    });

    const recipe =
      mailWristRecipe(
        "Scout's Scaled Bracers",
        [crafter]
      );

    const entries: ProfessionCrafterRecipeEntry[] =
      [
        {
          recipe,
          crafter,
          group: "Mail"
        }
      ];

    render(
      <ProfessionCrafterRecipeTable
        entries={entries}
        specializationEquipment={
          []
        }
        specializationMappingAvailable
      />
    );

    expect(
      screen.getAllByText(
        "Scout's Scaled Bracers"
      ).length
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Q5")
        .length
    ).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no matching entries", () => {
    render(
      <ProfessionCrafterRecipeTable
        entries={[]}
        specializationEquipment={
          []
        }
        specializationMappingAvailable
      />
    );

    expect(
      screen.getByText(
        /no recipes match this filter/i
      )
    ).toBeInTheDocument();
  });
});
