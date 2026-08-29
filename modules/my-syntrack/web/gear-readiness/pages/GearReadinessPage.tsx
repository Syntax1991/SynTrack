import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { GearCharacterRoster } from "../components/GearCharacterRoster";
import { GearReadinessSummary } from "../components/GearReadinessSummary";
import { GearSlotEditor } from "../components/GearSlotEditor";
import { GearSlotGrid } from "../components/GearSlotGrid";
import { useGearReadiness } from "../hooks/useGearReadiness";
import type {
  GearSlotFilter,
  GearSlotKey
} from "../types/gearReadiness.types";

export function GearReadinessPage() {
  const [selectedCharacterId, setSelectedCharacterId] =
    useState("");
  const [selectedSlotKey, setSelectedSlotKey] =
    useState<GearSlotKey | null>(null);
  const [filter, setFilter] =
    useState<GearSlotFilter>("all");
  const {
    overview,
    isLoading,
    error,
    pendingSlotKey,
    saveSlot,
    clearSlot
  } = useGearReadiness();

  useEffect(() => {
    if (!overview) {
      return;
    }

    const selectedExists =
      overview.characters.some(
        (character) =>
          character.id ===
          selectedCharacterId
      );

    if (!selectedExists) {
      setSelectedCharacterId(
        overview.characters[0]?.id ?? ""
      );
      setSelectedSlotKey(null);
    }
  }, [overview, selectedCharacterId]);

  const selectedCharacter =
    overview?.characters.find(
      (character) =>
        character.id === selectedCharacterId
    );
  const selectedSlot =
    selectedCharacter?.slots.find(
      (slot) => slot.key === selectedSlotKey
    );

  const selectCharacter = (
    characterId: string
  ) => {
    setSelectedCharacterId(characterId);
    setSelectedSlotKey(null);
  };

  return (
    <>
      <PageHeader
        actions={
          <Link
            className="button button-secondary"
            to="/vault-mythic-plus"
          >
            Vault / Mythic+
          </Link>
        }
        description="Track equipped items, item levels, and socket coverage across every character."
        eyebrow="PERSONAL GEAR READINESS"
        title="Gear"
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading || !overview ? (
        <LoadingPanel />
      ) : overview.characters.length === 0 ? (
        <section className="panel gear-page-empty">
          <p className="eyebrow">
            ROSTER REQUIRED
          </p>

          <h2>Add your first character</h2>

          <p>
            Gear readiness is tracked per
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
          <GearReadinessSummary
            overview={overview}
          />

          <div className="gear-readiness-layout">
            <GearCharacterRoster
              characters={overview.characters}
              onSelect={selectCharacter}
              selectedCharacterId={
                selectedCharacterId
              }
            />

            {selectedCharacter && (
              <div className="gear-readiness-workspace">
                {selectedSlot && (
                  <GearSlotEditor
                    isSaving={
                      pendingSlotKey ===
                      selectedSlot.key
                    }
                    key={selectedSlot.key}
                    onCancel={() =>
                      setSelectedSlotKey(null)
                    }
                    onClear={() =>
                      clearSlot(
                        selectedCharacter.id,
                        selectedSlot.key
                      )
                    }
                    onSave={(input) =>
                      saveSlot(
                        selectedCharacter.id,
                        selectedSlot.key,
                        input
                      )
                    }
                    slot={selectedSlot}
                  />
                )}

                <GearSlotGrid
                  character={selectedCharacter}
                  filter={filter}
                  onFilterChange={setFilter}
                  onSelectSlot={
                    setSelectedSlotKey
                  }
                  selectedSlotKey={
                    selectedSlotKey
                  }
                />
              </div>
            )}
          </div>

          <p className="gear-source-note">
            Manually tracked gear uses the same
            module contract that Battle.net and
            SynTrack_Core can synchronize later.
          </p>
        </>
      )}
    </>
  );
}
