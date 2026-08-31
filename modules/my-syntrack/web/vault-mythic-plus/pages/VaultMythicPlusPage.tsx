import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { WeekliesTabNav } from "../../shared/components/WeekliesTabNav";
import { VaultCharacterDetail } from "../components/VaultCharacterDetail";
import { VaultMatrix } from "../components/VaultMatrix";
import { useVaultMythicPlus } from "../hooks/useVaultMythicPlus";
import { formatVaultSummaryText } from "../utils/summaryText";

export function VaultMythicPlusPage() {
  const { overview, isLoading, error } = useVaultMythicPlus();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!overview || overview.characters.length === 0) {
      setSelectedCharacterId(null);
      return;
    }

    setSelectedCharacterId((current) => {
      if (
        current &&
        overview.characters.some((character) => character.id === current)
      ) {
        return current;
      }

      return overview.characters[0]?.id ?? null;
    });
  }, [overview]);

  const selectedCharacter =
    overview?.characters.find(
      (character) => character.id === selectedCharacterId
    ) ?? null;

  return (
    <>
      <WeekliesTabNav />

      <PageHeader
        actions={
          <Link className="button button-secondary" to="/weekly-checklist">
            Weeklies
          </Link>
        }
        description="Automatic Great Vault and Mythic+ progress from your synced WoW data."
        eyebrow="WEEKLY GAMEPLAY DETAIL"
        title="Vault / Mythic+"
      />

      {error ? <StatusMessage type="error">{error}</StatusMessage> : null}

      {isLoading || !overview ? (
        <LoadingPanel />
      ) : overview.characters.length === 0 ? (
        <section className="panel vault-empty-state">
          <p className="eyebrow">NO GAMEPLAY CHARACTERS</p>
          <h2>No gameplay-tracked characters</h2>
          <p>
            This page only includes characters with Full or Weekly tracking.
            Profession-only characters stay on Weeklies and Professions.
          </p>
          <Link className="button button-primary" to="/characters">
            Open character roster
          </Link>
        </section>
      ) : (
        <>
          <section className="panel matrix-panel">
            <div className="matrix-toolbar">
              <span className="matrix-summary">
                {formatVaultSummaryText(overview)}
              </span>
            </div>
            <VaultMatrix
              characters={overview.characters}
              onSelectCharacter={setSelectedCharacterId}
              selectedCharacterId={selectedCharacterId}
            />
          </section>

          {selectedCharacter ? (
            <VaultCharacterDetail character={selectedCharacter} />
          ) : null}
        </>
      )}
    </>
  );
}
