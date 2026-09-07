import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { RaidTaskBoard } from "../components/RaidTaskBoard";
import { RaidTaskCharacterRoster } from "../components/RaidTaskCharacterRoster";
import { RaidTaskComposer } from "../components/RaidTaskComposer";
import { RaidTaskSummary } from "../components/RaidTaskSummary";
import { useRaidTasks } from "../hooks/useRaidTasks";
import type { RaidTaskFilter } from "../types/raidTask.types";

export function RaidTasksPage() {
  const [selectedCharacterId, setSelectedCharacterId] =
    useState("");
  const [filter, setFilter] =
    useState<RaidTaskFilter>("open");
  const [isComposerOpen, setIsComposerOpen] =
    useState(false);
  const {
    overview,
    isLoading,
    error,
    pendingAction,
    addTask,
    updateCompletion,
    removeTask
  } = useRaidTasks();

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
    }
  }, [overview, selectedCharacterId]);

  const selectedCharacter =
    overview?.characters.find(
      (character) =>
        character.id === selectedCharacterId
    );

  return (
    <>
      <PageHeader
        actions={
          <div className="raid-task-page-actions">
            <Link
              className="button button-secondary"
              to="/weekly-checklist"
            >
              Weekly checklist
            </Link>

            <button
              className="button button-primary"
              disabled={!selectedCharacter}
              onClick={() =>
                setIsComposerOpen(true)
              }
              type="button"
            >
              Add raid task
            </button>
          </div>
        }
        description="Organize each character's personal preparation, assignments and deadlines before raid night."
        eyebrow="PERSONAL RAID READINESS"
        title="Raid Tasks"
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading || !overview ? (
        <LoadingPanel />
      ) : overview.characters.length === 0 ? (
        <section className="panel raid-task-page-empty">
          <p className="eyebrow">
            ROSTER REQUIRED
          </p>

          <h2>Add your first character</h2>

          <p>
            Personal raid preparation is
            tracked per character. Add or sync
            one to begin.
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
          <RaidTaskSummary overview={overview} />

          {selectedCharacter &&
            isComposerOpen && (
              <RaidTaskComposer
                character={selectedCharacter}
                isSaving={
                  pendingAction === "create"
                }
                onCancel={() =>
                  setIsComposerOpen(false)
                }
                onCreate={(input) =>
                  addTask(
                    selectedCharacter.id,
                    input
                  )
                }
              />
            )}

          <div className="raid-task-layout">
            <RaidTaskCharacterRoster
              characters={overview.characters}
              onSelect={setSelectedCharacterId}
              selectedCharacterId={
                selectedCharacterId
              }
            />

            {selectedCharacter && (
              <RaidTaskBoard
                character={selectedCharacter}
                filter={filter}
                onDelete={(taskId) => {
                  void removeTask(taskId);
                }}
                onFilterChange={setFilter}
                onToggle={(
                  taskId,
                  completed
                ) => {
                  void updateCompletion(
                    taskId,
                    completed
                  );
                }}
                pendingAction={pendingAction}
              />
            )}
          </div>

          <p className="raid-task-ownership-note">
            Personal reminders live here in My
            SynTrack, per character.
          </p>
        </>
      )}
    </>
  );
}
