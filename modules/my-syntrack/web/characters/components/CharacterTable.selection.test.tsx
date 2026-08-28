import {
  fireEvent,
  screen
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildCharacter,
  renderTable
} from "./characterTableTestHelpers";

describe("CharacterTable selection", () => {
  it("toggles a single character's selection without navigating or opening the tags drawer", () => {
    const {
      onToggleSelect,
      onManageTags
    } = renderTable([
      buildCharacter({
        id: "char-1",
        name: "Synblast"
      })
    ]);

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synblast"
      })
    );

    expect(
      onToggleSelect
    ).toHaveBeenCalledWith("char-1");

    expect(
      onManageTags
    ).not.toHaveBeenCalled();
  });

  it("reflects selected characters as checked", () => {
    renderTable(
      [
        buildCharacter({
          id: "char-1",
          name: "Synblast"
        }),
        buildCharacter({
          id: "char-2",
          name: "Synbloom"
        })
      ],
      {
        selectedCharacterIds: new Set([
          "char-1"
        ])
      }
    );

    expect(
      screen.getByRole("checkbox", {
        name: "Select Synblast"
      })
    ).toBeChecked();

    expect(
      screen.getByRole("checkbox", {
        name: "Select Synbloom"
      })
    ).not.toBeChecked();
  });

  it("header checkbox is checked when every visible character is selected", () => {
    renderTable(
      [
        buildCharacter({ id: "char-1" }),
        buildCharacter({ id: "char-2" })
      ],
      {
        selectedCharacterIds: new Set([
          "char-1",
          "char-2"
        ])
      }
    );

    expect(
      screen.getByRole("checkbox", {
        name: "Select all visible characters"
      })
    ).toBeChecked();
  });

  it("header checkbox is indeterminate when only some visible characters are selected", () => {
    renderTable(
      [
        buildCharacter({ id: "char-1" }),
        buildCharacter({ id: "char-2" })
      ],
      {
        selectedCharacterIds: new Set([
          "char-1"
        ])
      }
    );

    const header =
      screen.getByRole("checkbox", {
        name: "Select all visible characters"
      });

    expect(header).not.toBeChecked();
    expect(
      (header as HTMLInputElement)
        .indeterminate
    ).toBe(true);
  });

  it("clicking the header checkbox triggers select-all-visible, not per-row toggling", () => {
    const { onToggleSelectAllVisible } =
      renderTable([
        buildCharacter({ id: "char-1" }),
        buildCharacter({ id: "char-2" })
      ]);

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select all visible characters"
      })
    );

    expect(
      onToggleSelectAllVisible
    ).toHaveBeenCalledTimes(1);
  });
});
