import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrivacyPolicyPage } from "./PrivacyPolicyPage";

describe("PrivacyPolicyPage", () => {
  it("names the responsible operator and explains Battle.net-based processing", () => {
    const { container } = render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: "Datenschutzerklärung",
        level: 1
      })
    ).toBeInTheDocument();

    expect(container.textContent).toContain(
      "Simon PosnerGebhardshagen 1"
    );

    expect(
      screen.getAllByText(/Battle\.net/).length
    ).toBeGreaterThan(0);

    expect(
      screen.getByText(/localStorage/)
    ).toBeInTheDocument();
  });

  it("explains the optional Raidbots data flow and user rights", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicyPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "raidbots.com" })
    ).toHaveAttribute("href", "https://www.raidbots.com");

    expect(
      screen.getByText(/Löschung deiner Daten/)
    ).toBeInTheDocument();
  });
});
