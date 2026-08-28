import { useState } from "react";

export type CharacterSelection = {
  selectedCharacterIds: Set<string>;
  toggleSelectCharacter: (
    characterId: string
  ) => void;
  toggleSelectAllVisible: () => void;
  clearSelection: () => void;
  removeFromSelection: (
    characterId: string
  ) => void;
};

/*
 * Selection lives at page level, independent of the current filter -
 * a character selected before a filter change stays selected even
 * while hidden (see CharactersPage.tsx). "Select all" only ever means
 * the currently visible/filtered rows, never every character in the
 * roster.
 */
export function useCharacterSelection(
  visibleCharacters: { id: string }[]
): CharacterSelection {
  const [
    selectedCharacterIds,
    setSelectedCharacterIds
  ] = useState<Set<string>>(new Set());

  function toggleSelectCharacter(
    characterId: string
  ) {
    setSelectedCharacterIds(
      (previous) => {
        const next = new Set(previous);

        if (next.has(characterId)) {
          next.delete(characterId);
        }
        else {
          next.add(characterId);
        }

        return next;
      }
    );
  }

  function toggleSelectAllVisible() {
    const allVisibleSelected =
      visibleCharacters.every(
        (character) =>
          selectedCharacterIds.has(
            character.id
          )
      );

    setSelectedCharacterIds(
      (previous) => {
        const next = new Set(previous);

        if (allVisibleSelected) {
          for (const character of visibleCharacters) {
            next.delete(character.id);
          }
        }
        else {
          for (const character of visibleCharacters) {
            next.add(character.id);
          }
        }

        return next;
      }
    );
  }

  function clearSelection() {
    setSelectedCharacterIds(new Set());
  }

  function removeFromSelection(
    characterId: string
  ) {
    setSelectedCharacterIds(
      (previous) => {
        if (!previous.has(characterId)) {
          return previous;
        }

        const next = new Set(previous);
        next.delete(characterId);
        return next;
      }
    );
  }

  return {
    selectedCharacterIds,
    toggleSelectCharacter,
    toggleSelectAllVisible,
    clearSelection,
    removeFromSelection
  };
}
