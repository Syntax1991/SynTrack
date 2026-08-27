import {
  fireEvent,
  render,
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  describe,
  expect,
  it,
  vi
} from "vitest";
import type { Character } from "../types/character.types";

const createCharacter = vi
  .fn()
  .mockResolvedValue(undefined);

const updateCharacter = vi
  .fn()
  .mockResolvedValue(undefined);

const deleteCharacter = vi
  .fn()
  .mockResolvedValue(undefined);

const assignTag = vi
  .fn()
  .mockResolvedValue(undefined);

const unassignTag = vi
  .fn()
  .mockResolvedValue(undefined);

const raidTag = {
  id: "tag-raid",
  name: "Raid",
  color: null,
  sortOrder: 0,
  createdAt:
    "2026-08-01T00:00:00.000Z",
  updatedAt:
    "2026-08-01T00:00:00.000Z"
};

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

vi.mock(
  "../hooks/useCharacters",
  () => ({
    useCharacters: () => ({
      characters: [
        buildCharacter({
          id: "char-1",
          name: "Synblast"
        }),
        buildCharacter({
          id: "char-2",
          name: "Synbloom"
        })
      ],
      isLoading: false,
      error: null,
      createCharacter,
      updateCharacter,
      deleteCharacter
    })
  })
);

vi.mock(
  "../../../../professions/web/hooks/useProfessions",
  () => ({
    useProfessions: () => ({
      professions: [],
      isLoading: false,
      error: null
    })
  })
);

vi.mock(
  "../../tags/hooks/useTags",
  () => ({
    useTags: () => ({
      tags: [raidTag],
      assignments: [
        {
          characterId: "char-1",
          tagId: "tag-raid"
        }
      ],
      tagIdsByCharacterId: new Map([
        [
          "char-1",
          new Set(["tag-raid"])
        ]
      ]),
      isLoading: false,
      error: null,
      reload: () => {},
      create: vi
        .fn()
        .mockResolvedValue(
          undefined
        ),
      update: vi
        .fn()
        .mockResolvedValue(
          undefined
        ),
      remove: vi
        .fn()
        .mockResolvedValue(
          undefined
        ),
      assign: assignTag,
      unassign: unassignTag
    })
  })
);

const { CharactersPage } = await import(
  "./CharactersPage"
);

function renderPage() {
  return render(
    <MemoryRouter>
      <CharactersPage />
    </MemoryRouter>
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

  it("still deletes a character when Delete is chosen and confirmed", () => {
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockReturnValue(true);

    renderPage();

    fireEvent.click(
      screen.getByRole("button", {
        name: "More actions for Synblast"
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Delete"
      })
    );

    expect(
      deleteCharacter
    ).toHaveBeenCalledWith("char-1");

    confirmSpy.mockRestore();
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
