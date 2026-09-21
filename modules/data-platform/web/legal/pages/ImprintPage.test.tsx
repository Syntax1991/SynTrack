import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ImprintPage } from "./ImprintPage";

describe("ImprintPage", () => {
  it("shows the required TMG §5 operator identity and contact", () => {
    const { container } = render(
      <MemoryRouter>
        <ImprintPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: "Impressum", level: 1 })
    ).toBeInTheDocument();

    // The address spans multiple <br/>-separated text nodes, so this
    // checks the rendered text as a whole rather than one exact node.
    expect(container.textContent).toContain(
      "Simon PosnerGebhardshagen 137691 Boffzen"
    );

    expect(
      screen.getByRole("link", {
        name: "simon.posner1991@magenta.de"
      })
    ).toHaveAttribute(
      "href",
      "mailto:simon.posner1991@magenta.de"
    );
  });

  it("includes the Blizzard trademark disclaimer", () => {
    render(
      <MemoryRouter>
        <ImprintPage />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Blizzard Entertainment, Inc\./)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/inoffizielles Fan-Projekt/)
    ).toBeInTheDocument();
  });
});
