import {
  fireEvent,
  screen
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  bulkAssign,
  renderCharactersPage
} from "./charactersPageTestHelpers";

const { CharactersPage } = await import(
  "./CharactersPage"
);

function renderPage() {
  return renderCharactersPage(
    CharactersPage
  );
}

describe("CharactersPage bulk tagging", () => {
  it("shows the bulk action bar only once a character is selected", () => {
    renderPage();

    expect(
      screen.queryByText("selected")
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synblast"
      })
    );

    expect(
      screen.getByText("1 selected")
    ).toBeInTheDocument();
  });

  it("selecting multiple characters updates the count", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synblast"
      })
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synbloom"
      })
    );

    expect(
      screen.getByText("2 selected")
    ).toBeInTheDocument();
  });

  it("Clear empties the selection and hides the bulk bar", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synblast"
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Clear"
      })
    );

    expect(
      screen.queryByText("selected")
    ).not.toBeInTheDocument();
  });

  it("preserves selection across a filter change and back", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synblast"
      })
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synbloom"
      })
    );

    expect(
      screen.getByText("2 selected")
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
      screen.queryByText("Synbloom")
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("2 selected")
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(
        "Filter by tag"
      ),
      { target: { value: "" } }
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
    ).toBeChecked();
  });

  it("bulk-adds a tag to every selected character (NONE state)", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synbloom"
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tags"
      })
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Raid"
      })
    );

    expect(bulkAssign).toHaveBeenCalledWith({
      characterIds: ["char-2"],
      addTagIds: ["tag-raid"],
      removeTagIds: []
    });
  });

  it("bulk-removes a tag from every selected character (ALL state)", () => {
    renderPage();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Select Synblast"
      })
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Tags"
      })
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Raid"
      })
    );

    expect(bulkAssign).toHaveBeenCalledWith({
      characterIds: ["char-1"],
      addTagIds: [],
      removeTagIds: ["tag-raid"]
    });
  });
});
