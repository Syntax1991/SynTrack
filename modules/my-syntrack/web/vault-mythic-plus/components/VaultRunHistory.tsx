import type { MythicPlusRun } from "../types/vaultMythicPlus.types";

type VaultRunHistoryProps = {
  runs: MythicPlusRun[];
  pendingAction: string | null;
  onDeleteRun: (runId: string) => void;
};

function formatKeyLevel(
  keyLevel: number
) {
  return keyLevel === 0
    ? "M0"
    : `+${keyLevel}`;
}

export function VaultRunHistory({
  runs,
  pendingAction,
  onDeleteRun
}: VaultRunHistoryProps) {
  if (runs.length === 0) {
    return (
      <div className="vault-runs-empty">
        <strong>
          No runs logged yet
        </strong>

        <p>
          Add a completed Mythic or
          Mythic+ dungeon to calculate
          this character's Vault slots.
        </p>
      </div>
    );
  }

  return (
    <div className="vault-run-list">
      {runs.map((run, index) => (
        <article
          className="vault-run-row"
          key={run.id}
        >
          <span className="vault-run-rank">
            {String(
              index + 1
            ).padStart(2, "0")}
          </span>

          <span className="vault-run-level">
            {formatKeyLevel(
              run.keyLevel
            )}
          </span>

          <span className="vault-run-copy">
            <strong>
              {run.dungeonName ??
                "Mythic+ dungeon"}
            </strong>

            <small>
              {new Intl.DateTimeFormat(
                "en",
                {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                }
              ).format(
                new Date(
                  run.completedAt
                )
              )}
            </small>
          </span>

          <button
            aria-label={
              `Remove ${run.dungeonName ?? "dungeon"} ${formatKeyLevel(run.keyLevel)}`
            }
            className="vault-run-delete"
            disabled={
              pendingAction !== null
            }
            onClick={() =>
              onDeleteRun(run.id)
            }
            type="button"
          >
            ×
          </button>
        </article>
      ))}
    </div>
  );
}
