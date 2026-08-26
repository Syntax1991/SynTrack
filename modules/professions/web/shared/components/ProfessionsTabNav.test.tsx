import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ProfessionsTabNav } from "./ProfessionsTabNav";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProfessionsTabNav />
    </MemoryRouter>
  );
}

describe("ProfessionsTabNav - page-level Professions navigation", () => {
  it("renders Overview, Find Craft and Specializations pointing at their real existing routes", () => {
    renderAt("/professions");

    expect(
      screen.getByRole("tab", {
        name: "Overview"
      })
    ).toHaveAttribute(
      "href",
      "/professions"
    );

    expect(
      screen.getByRole("tab", {
        name: "Find Craft"
      })
    ).toHaveAttribute(
      "href",
      "/professions/crafters"
    );

    expect(
      screen.getByRole("tab", {
        name: "Specializations"
      })
    ).toHaveAttribute(
      "href",
      "/professions/specializations"
    );
  });

  it("marks only the current tab active, e.g. Find Craft while on /professions/crafters", () => {
    renderAt(
      "/professions/crafters"
    );

    expect(
      screen.getByRole("tab", {
        name: "Find Craft"
      })
    ).toHaveClass("active");

    expect(
      screen.getByRole("tab", {
        name: "Overview"
      })
    ).not.toHaveClass("active");

    expect(
      screen.getByRole("tab", {
        name: "Specializations"
      })
    ).not.toHaveClass("active");
  });

  it("does not mark Overview active on /professions/crafters even though both share the /professions prefix", () => {
    renderAt(
      "/professions/specializations"
    );

    expect(
      screen.getByRole("tab", {
        name: "Overview"
      })
    ).not.toHaveClass("active");
  });
});
