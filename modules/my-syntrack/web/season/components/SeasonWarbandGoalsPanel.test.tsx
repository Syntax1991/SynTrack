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

  it("renders only live tracked warband goals", () => {
    render(
      <SeasonWarbandGoalsPanel
        warbandGoals={[
          {
            key: "tier-visual",
            title: "Season tier visual (Sssensational!)",
            state: "INCOMPLETE",
            label: "open",
            detail: "Account-tier achievement 63473",
            actionLabel: "Earn Sssensational!"
          }
        ]}
      />
    );

    expect(screen.getByText("WARBAND SEASON GOALS")).toBeInTheDocument();
    expect(
      screen.getByText("Season tier visual (Sssensational!)")
    ).toBeInTheDocument();
    expect(screen.queryByText("Capture gap")).not.toBeInTheDocument();
  });
});
