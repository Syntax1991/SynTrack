import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CharacterDetailHeader } from "./CharacterDetailHeader";
import type { CharacterWeeklyState } from "../../overview/types/overview.types";

function character(
  overrides: Partial<CharacterWeeklyState["character"]> = {}
): CharacterWeeklyState["character"] {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    ...overrides
  };
}

describe("CharacterDetailHeader", () => {
  it("prefixes the class with the active spec when available (Phase F2)", () => {
    render(
      <MemoryRouter>
        <CharacterDetailHeader
          character={character({ activeSpec: "Restoration" })}
          tags={[]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Restoration Shaman/)).toBeInTheDocument();
  });

  it("falls back to the plain class name when no active spec is available", () => {
    render(
      <MemoryRouter>
        <CharacterDetailHeader character={character()} tags={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/^Shaman/)).toBeInTheDocument();
  });

  it("renders the guild name when present", () => {
    render(
      <MemoryRouter>
        <CharacterDetailHeader
          character={character({ guild: { name: "Before the Storm", realmSlug: "thrall" } })}
          tags={[]}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Before the Storm")).toBeInTheDocument();
  });

  it("renders no guild line when the character has no guild (Phase F2 - absence of optional guild works)", () => {
    render(
      <MemoryRouter>
        <CharacterDetailHeader character={character({ guild: null })} tags={[]} />
      </MemoryRouter>
    );

    expect(document.querySelector(".character-detail-guild")).not.toBeInTheDocument();
  });
});
