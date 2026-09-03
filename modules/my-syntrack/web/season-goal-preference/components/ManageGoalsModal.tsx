import { useState } from "react";
import { Drawer } from "../../../../../apps/web/src/shared/components/Drawer";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useManageGoals } from "../hooks/useManageGoals.js";
import { SeasonGoalRow } from "./SeasonGoalRow.js";
import type { SeasonGoalPreferenceValue } from "../types/seasonGoalPreference.types.js";

type ManageGoalsModalProps = {
  onClose: () => void;
};

const DEFAULT_PREFERENCE: SeasonGoalPreferenceValue = {
  enabled: true,
  numericTarget: null,
  enumTarget: null
};

export function ManageGoalsModal({ onClose }: ManageGoalsModalProps) {
  const { view, isLoading, error, save, reset } = useManageGoals(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<
    string | null
  >(null);

  if (isLoading || !view) {
    return (
      <Drawer onClose={onClose} title="Manage Goals">
        {error ? <StatusMessage type="error">{error}</StatusMessage> : <p>Loading…</p>}
      </Drawer>
    );
  }

  const characterDefinitions = view.definitions.filter(
    (definition) => definition.scope === "CHARACTER"
  );
  const warbandDefinitions = view.definitions.filter(
    (definition) => definition.scope === "WARBAND"
  );
  const activeCharacterId =
    selectedCharacterId ?? view.characters[0]?.id ?? null;
  const activeCharacter =
    view.characters.find((character) => character.id === activeCharacterId) ??
    null;

  return (
    <Drawer onClose={onClose} title="Manage Goals">
      {error && <StatusMessage type="error">{error}</StatusMessage>}

      <section className="manage-goals-section">
        <p className="eyebrow">CHARACTER GOALS</p>

        {view.characters.length > 0 && (
          <select
            className="manage-goals-character-select"
            onChange={(event) => setSelectedCharacterId(event.target.value)}
            value={activeCharacterId ?? ""}
          >
            {view.characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        )}

        {activeCharacter ? (
          characterDefinitions.map((definition) => {
            const value =
              activeCharacter.preferences[definition.key] ??
              DEFAULT_PREFERENCE;
            const isOverridden =
              value.enabled !== definition.defaultEnabled ||
              value.numericTarget !== definition.defaultNumericTarget ||
              value.enumTarget !== definition.defaultEnumTarget;

            return (
              <SeasonGoalRow
                definition={definition}
                isOverridden={isOverridden}
                key={definition.key}
                onChange={(next) =>
                  void save({
                    goalKey: definition.key,
                    characterId: activeCharacter.id,
                    ...next
                  })
                }
                onReset={() => void reset(definition.key, activeCharacter.id)}
                value={value}
              />
            );
          })
        ) : (
          <p>No gameplay Characters to configure yet.</p>
        )}
      </section>

      <section className="manage-goals-section">
        <p className="eyebrow">WARBAND GOALS</p>

        {warbandDefinitions.map((definition) => {
          const value = view.warband[definition.key] ?? DEFAULT_PREFERENCE;
          const isOverridden = value.enabled !== definition.defaultEnabled;

          return (
            <SeasonGoalRow
              definition={definition}
              isOverridden={isOverridden}
              key={definition.key}
              onChange={(next) =>
                void save({
                  goalKey: definition.key,
                  characterId: null,
                  ...next
                })
              }
              onReset={() => void reset(definition.key, null)}
              value={value}
            />
          );
        })}
      </section>
    </Drawer>
  );
}
