import {
  fireEvent,
  screen
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  assignTag,
  createCharacter,
  deleteCharacter,
  renderCharactersPage,
  unassignTag
} from "./charactersPageTestHelpers";

const { CharactersPage } = await import(
  "./CharactersPage"
);

function renderPage() {
  return renderCharactersPage(
    CharactersPage
  );
}

describe("CharactersPage", () => {
  it("renders the roster as the dominant, full-width surface (no permanent Add Character form)", () => {
    renderPage();

    expect(
      screen.getByText("Synblast")
    ).toBeInTheDocument();

    expect(
      screen.queryByLabelText("Name")
    ).not.toBeInTheDocument();
  });

  it("opens the creation UI only after the Add character action, not permanently", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add character"
      })
    );

    expect(
      screen.getByLabelText("Name")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Add Character"
      })
    ).toBeInTheDocument();
  });

  it("still creates a character with the submitted form values", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Add character"
      })
    );

    fireEvent.change(
      screen.getByLabelText("Name"),
      { target: { value: "Synspin" } }
    );

    fireEvent.change(
      screen.getByLabelText("Realm"),
      {
        target: {
          value: "Antonidas"
        }
      }
    );

    fireEvent.change(
      screen.getByLabelText("Class"),
      { target: { value: "Mage" } }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Character"
      })
    );

    await vi.waitFor(() => {
      expect(
        createCharacter
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Synspin",
          realm: "Antonidas",
          className: "Mage"
        })
      );
    });
  });

  it("opens the edit UI, prefilled, when Edit is chosen from a row's overflow menu", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Synblast"
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Edit"
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Edit Synblast"
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Name")
    ).toHaveValue("Synblast");
  });

  it("removes a character when Remove from SynTrack is chosen and confirmed", async () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Synblast"
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Remove from SynTrack"
      })
    );

    expect(deleteCharacter).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove character"
      })
    );

    await vi.waitFor(() => {
      expect(deleteCharacter).toHaveBeenCalledWith("char-1");
    });
  });

  it("shows each character's tags and filters the roster by tag", () => {
    renderPage();

    expect(
      screen.getByText(
        "Shaman · Antonidas · Raid"
      )
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(
        "Filter by tag"
      ),
      {
        target: { value: "tag-raid" }
      }
    );

    expect(
      screen.getByText("Synblast")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Synbloom")
    ).not.toBeInTheDocument();
  });

  it("assigns a tag to the correct character from the row's Tags popover", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Synbloom"
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Tags"
      })
    );

    expect(
      screen.getByRole("heading", {
        name: "Tags · Synbloom"
      })
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Raid"
      })
    );

    expect(assignTag).toHaveBeenCalledWith(
      "tag-raid",
      "char-2"
    );

    expect(
      unassignTag
    ).not.toHaveBeenCalled();
  });
});
