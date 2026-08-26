import { useState } from "react";
import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { VaultMatrix } from "../components/VaultMatrix";
import { VaultRunLogDrawer } from "../components/VaultRunLogDrawer";
import { useVaultMythicPlus } from "../hooks/useVaultMythicPlus";
import { formatVaultSummaryText } from "../utils/summaryText";
import { WeekliesTabNav } from "../../shared/components/WeekliesTabNav";

/*
 * Vault/M+ is account-wide first - one character = one row, with
 * manual run logging as a secondary drawer interaction rather than a
 * permanent half-page workspace.
 */
export function VaultMythicPlusPage() {
  const [
    runLogCharacterId,
    setRunLogCharacterId
  ] = useState<string | null>(null);

  const {
    overview,
    isLoading,
    error,
    pendingAction,
    addRun,
    deleteRun
  } = useVaultMythicPlus();

  const runLogCharacter =
    overview?.characters.find(
      (character) =>
        character.id ===
        runLogCharacterId
    ) ?? null;

  return (
    <>
      <WeekliesTabNav />

      <PageHeader
        actions={
          <Link
            className="button button-secondary"
            to="/weekly-checklist"
          >
            Weekly checklist
          </Link>
        }
        description="Log completed dungeon runs and see exactly which Great Vault slots they unlock."
        eyebrow="WEEKLY DUNGEON PROGRESS"
        title="Vault / Mythic+"
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading || !overview ? (
        <LoadingPanel />
      ) : overview.characters.length ===
        0 ? (
        <section className="panel vault-empty-state">
          <p className="eyebrow">
            ROSTER REQUIRED
          </p>

          <h2>Add your first character</h2>

          <p>
            Vault progress belongs to a
            character. Add or sync one to begin.
          </p>

          <Link
            className="button button-primary"
            to="/characters"
          >
            Open character roster
          </Link>
        </section>
      ) : (
        <section className="panel matrix-panel">
          <div className="matrix-toolbar">
            <span className="matrix-summary">
              {formatVaultSummaryText(
                overview
              )}
            </span>
          </div>

          <VaultMatrix
            characters={
              overview.characters
            }
            onOpenRunLog={
              setRunLogCharacterId
            }
          />
        </section>
      )}

      {runLogCharacter && (
        <VaultRunLogDrawer
          character={runLogCharacter}
          onAddRun={(input) =>
            addRun(
              runLogCharacter.id,
              input
            )
          }
          onClose={() =>
            setRunLogCharacterId(null)
          }
          onDeleteRun={(runId) => {
            void deleteRun(runId);
          }}
          pendingAction={pendingAction}
        />
      )}
    </>
  );
}
