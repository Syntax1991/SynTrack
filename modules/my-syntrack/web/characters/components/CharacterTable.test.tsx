import {
  fireEvent,
  screen
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildCharacter,
  renderTable
} from "./characterTableTestHelpers";

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

  it("links the character name to the canonical Character Detail route", () => {
    renderTable([
      buildCharacter({ id: "char-7" })
    ]);

    expect(
      screen.getByRole("link", {
        name: "Synblast"
      })
    ).toHaveAttribute(
      "href",
      "/characters/char-7"
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
