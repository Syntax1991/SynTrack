import { useMemo, useState } from "react";
import type { Character } from "../types/character.types";

export type CharacterFilters = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  classFilter: string;
  setClassFilter: (value: string) => void;
  professionFilter: string;
  setProfessionFilter: (value: string) => void;
  classOptions: string[];
  professionOptions: string[];
  visibleCharacters: Character[];
};

export function useCharacterFilters(
  characters: Character[]
): CharacterFilters {
  const [searchTerm, setSearchTerm] =
    useState("");

  const [classFilter, setClassFilter] =
    useState("");

  const [
    professionFilter,
    setProfessionFilter
  ] = useState("");

  const classOptions = useMemo(
    () =>
      Array.from(
        new Set(
          characters.map(
            (character) =>
              character.className
          )
        )
      ).sort((left, right) =>
        left.localeCompare(right, "en")
      ),
    [characters]
  );

  const professionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          characters.flatMap(
            (character) =>
              character.professions.map(
                (assignment) =>
                  assignment.profession
                    .name
              )
          )
        )
      ).sort((left, right) =>
        left.localeCompare(right, "en")
      ),
    [characters]
  );

  const visibleCharacters = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      return characters.filter(
        (character) => {
          if (
            classFilter &&
            character.className !==
              classFilter
          ) {
            return false;
          }

          if (
            professionFilter &&
            !character.professions.some(
              (assignment) =>
                assignment.profession
                  .name ===
                professionFilter
            )
          ) {
            return false;
          }

          if (
            normalizedSearch &&
            !character.name
              .toLowerCase()
              .includes(
                normalizedSearch
              )
          ) {
            return false;
          }

          return true;
        }
      );
    },
    [
      characters,
      searchTerm,
      classFilter,
      professionFilter
    ]
  );

  return {
    searchTerm,
    setSearchTerm,
    classFilter,
    setClassFilter,
    professionFilter,
    setProfessionFilter,
    classOptions,
    professionOptions,
    visibleCharacters
  };
}
