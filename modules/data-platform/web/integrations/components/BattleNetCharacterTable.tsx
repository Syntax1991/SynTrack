import type { BattleNetCharacterPreview } from "../types/battlenet.types";
import { CharacterNameWithIcon } from "../../../../../apps/web/src/shared/components/CharacterNameWithIcon";

type BattleNetCharacterTableProps = {
  characters:
    BattleNetCharacterPreview[];
  selectedKeys: Set<string>;
  onToggle: (
    key: string
  ) => void;
};

export function BattleNetCharacterTable({
  characters,
  selectedKeys,
  onToggle
}: BattleNetCharacterTableProps) {
  if (characters.length === 0) {
    return (
      <div className="empty-state">
        No characters match the current filters.
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="battlenet-character-table">
        <thead>
          <tr>
            <th>Selection</th>
            <th>Character</th>
            <th>Class</th>
            <th>Level</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {characters.map(
            (character) => {
              const selected =
                selectedKeys.has(
                  character.key
                );

              return (
                <tr
                  className={
                    selected
                      ? "selected-character-row"
                      : undefined
                  }
                  key={character.key}
                >
                  <td>
                    <input
                      aria-label={
                        `Select ${character.name}`
                      }
                      checked={selected}
                      onChange={() =>
                        onToggle(
                          character.key
                        )
                      }
                      type="checkbox"
                    />
                  </td>

                  <td>
                    <div className="character-identity">
                      <CharacterNameWithIcon
                        wowClassName={character.className}
                      >
                        <div>
                          <strong>
                            {character.name}
                          </strong>

                          <span>
                            {character.realm}
                          </span>
                        </div>
                      </CharacterNameWithIcon>
                    </div>
                  </td>

                  <td>
                    {character.className}
                  </td>

                  <td>
                    <span
                      className="level-badge ready"
                    >
                      {character.level}
                    </span>
                  </td>

                  <td>
                    <span
                      className={
                        character.imported
                          ? "character-import-badge imported"
                          : "character-import-badge new"
                      }
                    >
                      {character.imported
                        ? "Already imported"
                        : "New"}
                    </span>
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}