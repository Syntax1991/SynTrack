import { useState } from "react";
import type { ProfessionCharacterCoverage } from "../types/professionDetail.types";

export function useSelectedCharacter(
  characters: ProfessionCharacterCoverage[]
): {
  selectedCharacterId: string;
  selectedCoverage: ProfessionCharacterCoverage | null;
  setSelectedCharacterId: (
    characterId: string
  ) => void;
} {
  const [
    selectedCharacterId,
    setSelectedCharacterId
  ] =
    useState(
      characters[0]?.character.id ??
        ""
    );

  const selectedCoverage =
    characters.find(
      (coverage) =>
        coverage.character.id ===
        selectedCharacterId
    ) ??
    characters[0] ??
    null;

  return {
    selectedCharacterId:
      selectedCoverage?.character
        .id ?? selectedCharacterId,
    selectedCoverage,
    setSelectedCharacterId
  };
}
