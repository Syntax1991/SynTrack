import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicCrafterShareTooltip } from "./PublicCrafterShareTooltip";
import type { PublicCrafterShareRecipe } from "../types/crafterShare.types";

const recipe: PublicCrafterShareRecipe = {
  name: "Scout's Scaled Bracers",
  itemQuality: "EPIC",
  itemLevel: 331,
  iconUrl: null,
  resultQuality: 5,
  craftStatus: "SAFE",
  slotName: "Mail Wrist"
};

describe("PublicCrafterShareTooltip", () => {
  it("shows verified quality, listed item level, slot, and craft result", () => {
    render(<PublicCrafterShareTooltip recipe={recipe} />);

    expect(screen.getByText("Scout's Scaled Bracers")).toBeInTheDocument();
    expect(screen.getByText("Epic · Item Level 331")).toBeInTheDocument();
    expect(screen.getByText("Mail Wrist")).toBeInTheDocument();
    expect(screen.getByText("Q5")).toBeInTheDocument();
    expect(
      screen.queryByText("Final quality not reached")
    ).not.toBeInTheDocument();
  });

  it("shows captured quality for not-max crafts instead of cannot-craft", () => {
    render(
      <PublicCrafterShareTooltip
        recipe={{
          ...recipe,
          itemLevel: 197,
          resultQuality: 3,
          craftStatus: "NOT_SAFE"
        }}
      />
    );

    expect(screen.getByText("Q3 · not max")).toBeInTheDocument();
    expect(screen.getByText("Final quality not reached")).toBeInTheDocument();
  });

  it("omits item level when SynTrack has no listed value", () => {
    render(
      <PublicCrafterShareTooltip
        recipe={{
          ...recipe,
          itemLevel: null
        }}
      />
    );

    expect(screen.getByText("Epic")).toBeInTheDocument();
    expect(screen.queryByText(/Item Level/u)).not.toBeInTheDocument();
  });
});
