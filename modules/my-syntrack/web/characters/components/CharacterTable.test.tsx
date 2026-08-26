import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { Character } from "../types/character.types";
import { CharacterTable } from "./CharacterTable";

function buildCharacter(
  overrides: Partial<Character> = {}
): Character {
  return {
    id: "char-1",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 80,
    source: "MANUAL",
    lastSyncedAt: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    professions: [],
    ...overrides
  };
}

function renderTable(
  characters: Character[],
  onEdit = vi.fn(),
  onDelete = vi.fn()
) {
  render(
    <MemoryRouter>
      <CharacterTable
        characters={characters}
        minimumCraftingLevel={80}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </MemoryRouter>
  );

  return { onEdit, onDelete };
}

describe("CharacterTable", () => {
  it("renders exactly one row per character (roster remains rendered)", () => {
    renderTable([
      buildCharacter({
        id: "char-1",
        name: "Synblast"
      }),
      buildCharacter({
        id: "char-2",
        name: "Synbloom"
      })
    ]);

    expect(
      screen.getAllByRole("row")
    ).toHaveLength(3);

    expect(
      screen.getByText("Synblast")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Synbloom")
    ).toBeInTheDocument();
  });

  it("links Specializations to the real per-character route", () => {
    renderTable([
      buildCharacter({ id: "char-7" })
    ]);

    expect(
      screen.getByRole("link", {
        name: "Specializations"
      })
    ).toHaveAttribute(
      "href",
      "/characters/char-7/specializations"
    );
  });

  it("joins professions compactly instead of one badge per profession competing with the character name", () => {
    renderTable([
      buildCharacter({
        professions: [
          {
            id: "assign-1",
            skill: 100,
            knowledgePoints: 10,
            specializationSummary: null,
            profession: {
              id: "prof-1",
              key: "alchemy",
              name: "Alchemy",
              category: "CRAFTING"
            }
          },
          {
            id: "assign-2",
            skill: 100,
            knowledgePoints: 10,
            specializationSummary: null,
            profession: {
              id: "prof-2",
              key: "leatherworking",
              name: "Leatherworking",
              category: "CRAFTING"
            }
          }
        ]
      })
    ]);

    expect(
      screen.getByText(
        "Alchemy · Leatherworking"
      )
    ).toBeInTheDocument();
  });

  it("keeps Edit and Delete available behind the row overflow menu, and routes them to the correct character", () => {
    const { onEdit, onDelete } = renderTable(
      [
        buildCharacter({
          id: "char-1",
          name: "Synblast"
        }),
        buildCharacter({
          id: "char-2",
          name: "Synbloom"
        })
      ]
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Synbloom"
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Edit"
      })
    );

    expect(onEdit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "char-2"
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Synbloom"
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Delete"
      })
    );

    expect(onDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "char-2"
      })
    );

    expect(onEdit).not.toHaveBeenCalledWith(
      expect.objectContaining({
        id: "char-1"
      })
    );
  });
});
