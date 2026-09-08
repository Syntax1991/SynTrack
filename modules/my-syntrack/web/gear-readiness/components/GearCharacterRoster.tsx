import type { CSSProperties } from "react";
import { WowClassIcon } from "../../../../../apps/web/src/shared/components/WowClassIcon";
import type { GearCharacter } from "../types/gearReadiness.types";

type GearCharacterRosterProps = {
  characters: GearCharacter[];
  selectedCharacterId: string;
  onSelect: (characterId: string) => void;
};

export function GearCharacterRoster({
  characters,
  selectedCharacterId,
  onSelect
}: GearCharacterRosterProps) {
  return (
    <section className="panel gear-roster-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            GEAR ROSTER
          </p>

          <h2>Characters</h2>
        </div>

        <span className="gear-roster-count">
          {characters.length}
        </span>
      </div>

      <div className="gear-character-list">
        {characters.map((character) => (
          <button
            aria-pressed={
              selectedCharacterId ===
              character.id
            }
            className={
              selectedCharacterId ===
                character.id
                ? "gear-character-row is-selected"
                : "gear-character-row"
            }
            key={character.id}
            onClick={() =>
              onSelect(character.id)
            }
            type="button"
          >
            <span className="gear-character-avatar">
              <WowClassIcon
                size="lg"
                wowClassName={character.className}
              />
            </span>

            <span className="gear-character-copy">
              <strong>{character.name}</strong>
              <small>
                {character.className}
                {" - "}
                {character.realm}
              </small>
            </span>

            <span className="gear-character-level">
              <strong>
                {character.averageItemLevel ??
                  "--"}
              </strong>
              <small>iLvl</small>
            </span>

            <span
              aria-label={
                `${character.readinessPercent}% ready`
              }
              className="gear-character-readiness"
              style={{
                "--gear-readiness":
                  `${character.readinessPercent}%`
              } as CSSProperties}
            >
              <strong>
                {character.readinessPercent}%
              </strong>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
