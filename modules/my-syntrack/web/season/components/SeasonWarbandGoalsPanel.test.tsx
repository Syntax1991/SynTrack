import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeasonWarbandGoalsPanel } from "./SeasonWarbandGoalsPanel";

describe("SeasonWarbandGoalsPanel", () => {
  it("hides entirely when no live warband goals exist", () => {
    const { container } = render(
      <SeasonWarbandGoalsPanel warbandGoals={[]} />
    );

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByText("WARBAND SEASON PROGRESS")
    ).not.toBeInTheDocument();
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

    expect(screen.getByText("WARBAND SEASON PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("Warband seasonal progress")).toBeInTheDocument();
    expect(screen.getByText("Sssensational!")).toBeInTheDocument();
    expect(
      screen.getByText("Enhanced Season 2 tier visuals")
    ).toBeInTheDocument();
    expect(screen.queryByText(/63473/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Account-tier/i)).not.toBeInTheDocument();
  });

  it("renders Portals and Valeera independently, without tier-visual leaking in", () => {
    render(
      <SeasonWarbandGoalsPanel
        warbandGoals={[
          {
            key: "portals",
            title: "Dungeon portals",
            state: "INCOMPLETE",
            label: "6/8",
            detail: "Timed +10 dungeon portals for Midnight Season 2",
            actionLabel: null
          },
          {
            key: "valeera-80",
            title: "Valeera level 80",
            state: "COMPLETE",
            label: "✓",
            detail: "Buddy System VIII: Valeera",
            actionLabel: null
          }
        ]}
      />
    );

    expect(screen.getByText("6/8")).toBeInTheDocument();
    expect(screen.getByText("Dungeon portals")).toBeInTheDocument();
    expect(screen.getByText("Valeera level 80")).toBeInTheDocument();
    expect(screen.queryByText("Sssensational!")).not.toBeInTheDocument();
  });
});
