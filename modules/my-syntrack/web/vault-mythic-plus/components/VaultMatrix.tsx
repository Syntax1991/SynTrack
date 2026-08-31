import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { VaultGameplayCharacter } from "../types/vaultMythicPlus.types";
import {
  formatDomainFraction,
  formatHighestKeyToken
} from "../utils/vaultCellFormatting";

type VaultMatrixProps = {
  characters: VaultGameplayCharacter[];
  selectedCharacterId: string | null;
  onSelectCharacter: (characterId: string) => void;
};

export function VaultMatrix({
  characters,
  selectedCharacterId,
  onSelectCharacter
}: VaultMatrixProps) {
  if (characters.length === 0) {
    return (
      <div className="empty-state">No gameplay-tracked characters.</div>
    );
  }

  return (
    <div className="table-scroll matrix-scroll">
      <table className="dense-matrix">
        <thead>
          <tr>
            <th>Character</th>
            <th className="matrix-col-narrow">Vault</th>
            <th className="matrix-col-narrow">M+</th>
            <th className="matrix-col-narrow">Raid</th>
            <th className="matrix-col-narrow">Delves</th>
            <th className="matrix-col-narrow">Highest</th>
            <th className="matrix-col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {characters.map((character) => {
            const selected = character.id === selectedCharacterId;

            return (
              <tr
                className={selected ? "matrix-row-selected" : undefined}
                key={character.id}
              >
                <td>
                  <div className="matrix-identity">
                    <button
                      className="matrix-character-link text-button"
                      onClick={() => onSelectCharacter(character.id)}
                      style={{ color: getClassColor(character.className) }}
                      type="button"
                    >
                      {character.name}
                    </button>
                    <span>
                      {character.className}
                      {" · "}
                      {character.realm}
                    </span>
                  </div>
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken token={formatDomainFraction(character.vault)} />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken
                    token={formatDomainFraction(character.mythicPlus)}
                  />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken token={formatDomainFraction(character.raid)} />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken token={formatDomainFraction(character.delves)} />
                </td>
                <td className="matrix-col-narrow">
                  <StatusToken token={formatHighestKeyToken(character)} />
                </td>
                <td className="matrix-col-action">
                  <button
                    className="text-button"
                    onClick={() => onSelectCharacter(character.id)}
                    type="button"
                  >
                    {character.action}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
