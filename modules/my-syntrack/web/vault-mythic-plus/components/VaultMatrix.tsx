import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type { VaultCharacter } from "../types/vaultMythicPlus.types";
import {
  formatHighestKeyToken,
  formatRunsLoggedToken,
  formatVaultSlotToken
} from "../utils/vaultCellFormatting";

type VaultMatrixProps = {
  characters: VaultCharacter[];
  onOpenRunLog: (
    characterId: string
  ) => void;
};

/*
 * Account-wide Vault view - one character = one row, so unlocked
 * slots and unknown-vs-tracked state are answerable without clicking
 * through every character. Logging a run is a secondary interaction
 * (opens a drawer) rather than a permanently reserved half-page panel.
 */
export function VaultMatrix({
  characters,
  onOpenRunLog
}: VaultMatrixProps) {
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
              Runs
            </th>

            <th className="matrix-col-narrow">
              Slot 1
            </th>

            <th className="matrix-col-narrow">
              Slot 2
            </th>

            <th className="matrix-col-narrow">
              Slot 3
            </th>

            <th className="matrix-col-narrow">
              Highest
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
                    <strong
                      style={{
                        color:
                          getClassColor(
                            character.className
                          )
                      }}
                    >
                      {character.name}
                    </strong>

                    <span>
                      {character.className}
                      {" · "}
                      {character.realm}
                    </span>
                  </div>
                </td>

                <td className="matrix-col-narrow">
                  <StatusToken
                    token={formatRunsLoggedToken(
                      character
                    )}
                  />
                </td>

                {character.vaultSlots.map(
                  (slot) => (
                    <td
                      className="matrix-col-narrow"
                      key={
                        slot.threshold
                      }
                    >
                      <StatusToken
                        token={formatVaultSlotToken(
                          character,
                          slot
                        )}
                      />
                    </td>
                  )
                )}

                <td className="matrix-col-narrow">
                  <StatusToken
                    token={formatHighestKeyToken(
                      character
                    )}
                  />
                </td>

                <td className="matrix-col-action">
                  <button
                    className="text-button"
                    onClick={() =>
                      onOpenRunLog(
                        character.id
                      )
                    }
                    type="button"
                  >
                    Log run
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
