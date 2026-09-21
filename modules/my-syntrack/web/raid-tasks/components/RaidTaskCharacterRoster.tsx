import type { RaidTaskCharacter } from "../types/raidTask.types";
import { WowClassIcon } from "../../../../../apps/web/src/shared/components/WowClassIcon";

type RaidTaskCharacterRosterProps = {
  characters: RaidTaskCharacter[];
  selectedCharacterId: string;
  onSelect: (characterId: string) => void;
};

export function RaidTaskCharacterRoster({
  characters,
  selectedCharacterId,
  onSelect
}: RaidTaskCharacterRosterProps) {
  return (
    <section className="panel raid-task-roster-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">
            RAID ROSTER
          </p>

          <h2>Characters</h2>
        </div>

        <span className="raid-task-roster-count">
          {characters.length}
        </span>
      </div>

      <div className="raid-task-character-list">
        {characters.map((character) => {
          const taskCount =
            character.openTaskCount +
            character.completedTaskCount;
          const readiness = taskCount === 0
            ? 0
            : Math.round(
                (
                  character.completedTaskCount /
                  taskCount
                ) * 100
              );

          return (
            <button
              aria-pressed={
                selectedCharacterId ===
                character.id
              }
              className={
                selectedCharacterId ===
                  character.id
                  ? "raid-task-character-row is-selected"
                  : "raid-task-character-row"
              }
              key={character.id}
              onClick={() =>
                onSelect(character.id)
              }
              type="button"
            >
              <span className="raid-task-character-avatar">
                <WowClassIcon
                  size="lg"
                  wowClassName={character.className}
                />
              </span>

              <span className="raid-task-character-copy">
                <strong>{character.name}</strong>
                <small>
                  {character.className}
                  {" - "}
                  {character.realm}
                </small>
              </span>

              <span className="raid-task-character-status">
                <strong>
                  {character.openTaskCount}
                </strong>
                <small>open</small>
              </span>

              <span
                aria-label={`${readiness}% ready`}
                className="raid-task-readiness"
                style={{
                  "--raid-readiness":
                    `${readiness}%`
                } as React.CSSProperties}
              >
                <strong>{readiness}%</strong>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
