import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeasonWarbandGoalsPanel } from "./SeasonWarbandGoalsPanel";

describe("SeasonWarbandGoalsPanel", () => {
  it("hides entirely when no live warband goals exist", () => {
    const { container } = render(
      <SeasonWarbandGoalsPanel warbandGoals={[]} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("WARBAND SEASON GOALS")).not.toBeInTheDocument();
    expect(screen.queryByText("capture pending")).not.toBeInTheDocument();
    expect(screen.queryByText("Delver's Journey")).not.toBeInTheDocument();
  });

  it("renders Sssensational with product-facing detail and no raw IDs", () => {
    render(
      <SeasonWarbandGoalsPanel
        warbandGoals={[
          {
            key: "tier-visual",
            title: "Sssensational!",
            state: "COMPLETE",
            label: "✓",
            detail: "Enhanced Season 2 tier visuals",
            actionLabel: null
          }
        ]}
      />
    );

    expect(screen.getByText("WARBAND SEASON GOALS")).toBeInTheDocument();
    expect(screen.getByText("Warband seasonal progress")).toBeInTheDocument();
    expect(screen.getByText("Sssensational!")).toBeInTheDocument();
    expect(
      screen.getByText("Enhanced Season 2 tier visuals")
    ).toBeInTheDocument();
    expect(screen.queryByText(/63473/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Account-tier/i)).not.toBeInTheDocument();
  });
});
