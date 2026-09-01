import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterRowActions } from "./CharacterRowActions";

describe("CharacterRowActions", () => {
  it("menu contains Remove from SynTrack, not Delete", () => {
    render(
      <CharacterRowActions
        characterName="Synblast"
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onManageTags={vi.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Synblast"
      })
    );

    expect(
      screen.getByRole("menuitem", { name: "Remove from SynTrack" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Delete" })
    ).not.toBeInTheDocument();
  });
});
