import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { WeekliesTabNav } from "./WeekliesTabNav";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WeekliesTabNav />
    </MemoryRouter>
  );
}

describe("WeekliesTabNav - page-level Weeklies navigation", () => {
  it("renders Overview and Vault / M+ pointing at the real existing Weekly Checklist and Vault/M+ routes, without duplicating their business logic", () => {
    renderAt("/weekly-checklist");

    expect(
      screen.getByRole("tab", {
        name: "Overview"
      })
    ).toHaveAttribute(
      "href",
      "/weekly-checklist"
    );

    expect(
      screen.getByRole("tab", {
        name: "Vault / M+"
      })
    ).toHaveAttribute(
      "href",
      "/vault-mythic-plus"
    );
  });

  it("does not render a Tasks tab (no real generic weekly task implementation exists yet)", () => {
    renderAt("/weekly-checklist");

    expect(
      screen.queryByRole("tab", {
        name: "Tasks"
      })
    ).not.toBeInTheDocument();
  });

  it("marks Vault / M+ active while on its route and Overview active while on Weekly Checklist", () => {
    renderAt("/vault-mythic-plus");

    expect(
      screen.getByRole("tab", {
        name: "Vault / M+"
      })
    ).toHaveClass("active");

    expect(
      screen.getByRole("tab", {
        name: "Overview"
      })
    ).not.toHaveClass("active");
  });
});
