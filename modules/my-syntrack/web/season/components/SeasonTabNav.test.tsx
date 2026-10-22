import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { SeasonTabNav } from "./SeasonTabNav";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SeasonTabNav />
    </MemoryRouter>
  );
}

describe("SeasonTabNav", () => {
  it("links the season goals and the Bonus Roll planner", () => {
    renderAt("/season");

    expect(screen.getByRole("tab", { name: "Goals" })).toHaveAttribute("href", "/season");
    expect(screen.getByRole("tab", { name: "Bonus Rolls" })).toHaveAttribute("href", "/season/bonus-rolls");
  });

  it("marks only the current section active", () => {
    renderAt("/season/bonus-rolls");

    expect(screen.getByRole("tab", { name: "Bonus Rolls" })).toHaveClass("active");
    expect(screen.getByRole("tab", { name: "Goals" })).not.toHaveClass("active");
  });
});
