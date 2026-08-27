import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { Character } from "../types/character.types";
import { CharacterRowActions } from "./CharacterRowActions";

type CharacterTableProps = {
  characters: Character[];
  minimumCraftingLevel: number;
  onDelete: (
    character: Character
  ) => void;
  onEdit: (
    character: Character
  ) => void;
};

export function CharacterTable({
  characters,
  minimumCraftingLevel,
  onDelete,
  onEdit
}: CharacterTableProps) {
  if (characters.length === 0) {
    return (
      <div className="empty-state">
        No characters match this filter.
      </div>
    );
  }

  return (
    <div className="table-scroll matrix-scroll">
      <table className="dense-matrix">
        <thead>
          <tr>
            <th>Character</th>
            <th className="matrix-col-narrow">
              Level
            </th>
            <th>Professions</th>
            <th className="matrix-col-narrow">
              Source
            </th>
            <th
              aria-label="Actions"
              className="matrix-col-action"
            />
          </tr>
        </thead>

        <tbody>
          {characters.map(
            (character) => (
              <tr key={character.id}>
                <td>
                  <div className="matrix-identity">
                    <Link
                      style={{
                        color:
                          getClassColor(
                            character.className
                          )
                      }}
                      to={`/characters/${character.id}`}
                    >
                      <strong>
                        {character.name}
                      </strong>
                    </Link>

                    <span>
                      {character.className}
                      {" · "}
                      {character.realm}
                    </span>
                  </div>
                </td>

                <td className="matrix-col-narrow">
                  <StatusToken
                    token={
                      character.level >=
                      minimumCraftingLevel
                        ? {
                            symbol: String(
                              character.level
                            ),
                            tone: "ready",
                            title: `Level ${character.level} - meets the level ${minimumCraftingLevel} crafting minimum`
                          }
                        : {
                            symbol: String(
                              character.level
                            ),
                            tone: "progress",
                            title: `Level ${character.level} - below the level ${minimumCraftingLevel} crafting minimum`
                          }
                    }
                  />
                </td>

                <td>
                  {character.professions
                    .length === 0 ? (
                    <span className="matrix-token matrix-token-not-tracked">
                      No professions
                    </span>
                  ) : (
                    <span
                      className="matrix-professions"
                      title={character.professions
                        .map(
                          (assignment) =>
                            assignment
                              .profession
                              .name
                        )
                        .join(", ")}
                    >
                      {character.professions
                        .map(
                          (assignment) =>
                            assignment
                              .profession
                              .name
                        )
                        .join(" · ")}
                    </span>
                  )}
                </td>

                <td className="matrix-col-narrow">
                  <span
                    className="matrix-source"
                    title={`Source: ${character.source}`}
                  >
                    {character.source}
                  </span>
                </td>

                <td className="matrix-col-action">
                  <div className="table-actions character-table-actions">
                    <Link
                      className="text-button"
                      to={
                        `/characters/${character.id}/specializations`
                      }
                    >
                      Specializations
                    </Link>

                    <CharacterRowActions
                      characterName={
                        character.name
                      }
                      onDelete={() =>
                        onDelete(
                          character
                        )
                      }
                      onEdit={() =>
                        onEdit(character)
                      }
                    />
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
