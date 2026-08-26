import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { MythicPlusRunWorkspace } from "../components/MythicPlusRunWorkspace";
import { VaultCharacterRoster } from "../components/VaultCharacterRoster";
import { VaultSlotGrid } from "../components/VaultSlotGrid";
import { VaultSummaryStats } from "../components/VaultSummaryStats";
import { useVaultMythicPlus } from "../hooks/useVaultMythicPlus";
import { WeekliesTabNav } from "../../shared/components/WeekliesTabNav";

export function VaultMythicPlusPage() {
  const [selectedCharacterId, setSelectedCharacterId] =
    useState("");
  const {
    overview,
    isLoading,
    error,
    pendingAction,
    addRun,
    deleteRun
  } = useVaultMythicPlus();

  useEffect(() => {
    if (!overview) {
      return;
    }

    if (
      !overview.characters.some(
        (character) =>
          character.id ===
          selectedCharacterId
      )
    ) {
      setSelectedCharacterId(
        overview.characters[0]?.id ?? ""
      );
    }
  }, [overview, selectedCharacterId]);

  const selectedCharacter =
    overview?.characters.find(
      (character) =>
        character.id === selectedCharacterId
    );

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
      ) : overview.characters.length === 0 ? (
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
        <>
          <VaultSummaryStats overview={overview} />

          <div className="vault-overview-layout">
            <VaultCharacterRoster
              characters={overview.characters}
              onSelect={setSelectedCharacterId}
              selectedCharacterId={
                selectedCharacterId
              }
            />

            {selectedCharacter && (
              <div className="vault-character-workspace">
                <VaultSlotGrid
                  character={selectedCharacter}
                />

                <MythicPlusRunWorkspace
                  character={selectedCharacter}
                  onAddRun={(input) =>
                    addRun(
                      selectedCharacter.id,
                      input
                    )
                  }
                  onDeleteRun={(runId) => {
                    void deleteRun(runId);
                  }}
                  pendingAction={pendingAction}
                />
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
