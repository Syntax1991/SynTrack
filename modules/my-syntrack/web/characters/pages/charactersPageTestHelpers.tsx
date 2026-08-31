import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { Character } from "../types/character.types";

export const createCharacter = vi
  .fn()
  .mockResolvedValue(undefined);

export const updateCharacter = vi
  .fn()
  .mockResolvedValue(undefined);

export const deleteCharacter = vi
  .fn()
  .mockResolvedValue(undefined);

export const assignTag = vi
  .fn()
  .mockResolvedValue(undefined);

export const unassignTag = vi
  .fn()
  .mockResolvedValue(undefined);

export const bulkAssign = vi
  .fn()
  .mockResolvedValue(undefined);

export const raidTag = {
  id: "tag-raid",
  name: "Raid",
  color: null,
  sortOrder: 0,
  createdAt:
    "2026-08-01T00:00:00.000Z",
  updatedAt:
    "2026-08-01T00:00:00.000Z"
};

export function buildCharacter(
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

vi.mock("../hooks/useRemovedCharacters", () => ({
  useRemovedCharacters: () => ({
    items: [],
    isLoading: false,
    error: null,
    restoringId: null,
    reload: vi.fn().mockResolvedValue(undefined),
    restoreCharacter: vi.fn().mockResolvedValue(undefined)
  })
}));

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
      unassign: unassignTag,
      bulkAssign
    })
  })
);

export function renderCharactersPage(
  CharactersPageComponent: () => ReactElement
) {
  return render(
    <MemoryRouter>
      <CharactersPageComponent />
    </MemoryRouter>
  );
}
