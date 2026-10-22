import { useState, type FormEvent } from "react";
import type { Character } from "../../characters/types/character.types";
import {
  useJournalEncounters,
  useJournalInstances,
  useJournalLoot
} from "../hooks/useJournalCatalog";
import type { BonusRollCreateInput } from "../types/bonusRoll.types";
import { LootItemSelect } from "./LootItemSelect";

type BonusRollPlanFormProps = {
  characters: Character[];
  onSubmit: (input: BonusRollCreateInput) => Promise<void>;
};

const kindLabel = { RAID: "Raids", DUNGEON: "Dungeons" } as const;

/*
 * Character -> current-season instance -> boss -> optional target item.
 * Each dropdown is fed by the level above; changing a level resets the
 * ones below so a stale boss/item can never be submitted.
 */
export function BonusRollPlanForm({ characters, onSubmit }: BonusRollPlanFormProps) {
  const [characterId, setCharacterId] = useState("");
  const [instanceId, setInstanceId] = useState<number | null>(null);
  const [encounterId, setEncounterId] = useState<number | null>(null);
  const [targetItemId, setTargetItemId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const instances = useJournalInstances();
  const encounters = useJournalEncounters(instanceId);
  const loot = useJournalLoot(instanceId, encounterId);

  const catalogError = instances.error ?? encounters.error ?? loot.error;
  const canSubmit = characterId !== "" && instanceId !== null && encounterId !== null && !isSubmitting;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ characterId, instanceId, encounterId, targetItemId, note: note.trim() || null });
      setTargetItemId(null);
      setNote("");
    } catch {
      // The page shows the API error; keep the form filled for a retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="panel bonus-roll-plan-form" onSubmit={submit}>
      <p className="panel-title">PLAN A BONUS ROLL</p>

      <div className="bonus-roll-plan-grid">
        <label className="bonus-roll-field">
          <span>Character</span>
          <select aria-label="Character" onChange={(event) => setCharacterId(event.target.value)} value={characterId}>
            <option disabled value="">Choose a character</option>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} – {character.realm}
              </option>
            ))}
          </select>
        </label>

        <label className="bonus-roll-field">
          <span>Instance</span>
          <select
            aria-label="Instance"
            disabled={instances.isLoading}
            onChange={(event) => {
              setInstanceId(Number(event.target.value));
              setEncounterId(null);
              setTargetItemId(null);
            }}
            value={instanceId ?? ""}
          >
            <option disabled value="">{instances.isLoading ? "Loading season…" : "Choose an instance"}</option>
            {(["RAID", "DUNGEON"] as const).map((kind) => (
              <optgroup key={kind} label={kindLabel[kind]}>
                {instances.items.filter((entry) => entry.kind === kind).map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="bonus-roll-field">
          <span>Boss</span>
          <select
            aria-label="Boss"
            disabled={instanceId === null || encounters.isLoading}
            onChange={(event) => {
              setEncounterId(Number(event.target.value));
              setTargetItemId(null);
            }}
            value={encounterId ?? ""}
          >
            <option disabled value="">{encounters.isLoading ? "Loading bosses…" : "Choose a boss"}</option>
            {encounters.items.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </select>
        </label>

        <LootItemSelect
          disabled={encounterId === null}
          emptyLabel="No specific target"
          isLoading={loot.isLoading}
          items={loot.items}
          label="Target item"
          onChange={setTargetItemId}
          value={targetItemId}
        />

        <label className="bonus-roll-field bonus-roll-note-field">
          <span>Note</span>
          <input
            aria-label="Note"
            maxLength={200}
            onChange={(event) => setNote(event.target.value)}
            placeholder="optional, e.g. BiS trinket"
            value={note}
          />
        </label>

        <button className="button button-primary bonus-roll-submit" disabled={!canSubmit} type="submit">
          {isSubmitting ? "Adding…" : "Add roll"}
        </button>
      </div>

      {catalogError && <p className="bonus-roll-catalog-error">{catalogError}</p>}
    </form>
  );
}
