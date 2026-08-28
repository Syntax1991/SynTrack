import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import type { Character } from "../types/character.types";
import { CharacterTable } from "./CharacterTable";

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

export function renderTable(
  characters: Character[],
  {
    onEdit = vi.fn<
      (character: Character) => void
    >(),
    onDelete = vi.fn<
      (character: Character) => void
    >(),
    onManageTags = vi.fn<
      (character: Character) => void
    >(),
    onToggleSelect = vi.fn<
      (characterId: string) => void
    >(),
    onToggleSelectAllVisible = vi.fn<
      () => void
    >(),
    selectedCharacterIds = new Set<string>()
  }: {
    onEdit?: (
      character: Character
    ) => void;
    onDelete?: (
      character: Character
    ) => void;
    onManageTags?: (
      character: Character
    ) => void;
    onToggleSelect?: (
      characterId: string
    ) => void;
    onToggleSelectAllVisible?: () => void;
    selectedCharacterIds?: Set<string>;
  } = {}
) {
  render(
    <MemoryRouter>
      <CharacterTable
        characters={characters}
        minimumCraftingLevel={80}
        onDelete={onDelete}
        onEdit={onEdit}
        onManageTags={onManageTags}
        onToggleSelect={onToggleSelect}
        onToggleSelectAllVisible={
          onToggleSelectAllVisible
        }
        selectedCharacterIds={
          selectedCharacterIds
        }
        tagIdsByCharacterId={
          new Map()
        }
        tags={[]}
      />
    </MemoryRouter>
  );

  return {
    onEdit,
    onDelete,
    onManageTags,
    onToggleSelect,
    onToggleSelectAllVisible
  };
}
