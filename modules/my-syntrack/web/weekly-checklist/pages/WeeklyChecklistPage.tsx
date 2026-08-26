import {
  useEffect,
  useState
} from "react";
import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { WeeklyCharacterRoster } from "../components/WeeklyCharacterRoster";
import { WeeklySummaryStats } from "../components/WeeklySummaryStats";
import { WeeklyTaskList } from "../components/WeeklyTaskList";
import { useWeeklyChecklist } from "../hooks/useWeeklyChecklist";
import { WeekliesTabNav } from "../../shared/components/WeekliesTabNav";

export function WeeklyChecklistPage() {
  const [selectedCharacterId, setSelectedCharacterId] =
    useState("");
  const {
    checklist,
    isLoading,
    error,
    pendingAction,
    setTaskCompleted,
    setAllTasksCompleted
  } = useWeeklyChecklist();

  useEffect(() => {
    if (!checklist) {
      return;
    }

    const selectedExists =
      checklist.characters.some(
        (character) =>
          character.id ===
          selectedCharacterId
      );

    if (!selectedExists) {
      setSelectedCharacterId(
        checklist.characters[0]?.id ?? ""
      );
    }
  }, [checklist, selectedCharacterId]);

  const selectedCharacter =
    checklist?.characters.find(
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
            to="/characters"
          >
            Manage characters
          </Link>
        }
        description="Keep every character's recurring work visible in one reset-aware checklist."
        eyebrow="WEEKLY RESET"
        title="Weekly Checklist"
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading || !checklist ? (
        <LoadingPanel />
      ) : checklist.characters.length === 0 ? (
        <section className="panel weekly-empty-state">
          <p className="eyebrow">
            ROSTER REQUIRED
          </p>

          <h2>Add your first character</h2>

          <p>
            Weekly progress is tracked per
            character. Add or sync a character
            to begin.
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
          <WeeklySummaryStats
            checklist={checklist}
          />

          <div className="weekly-checklist-layout">
            <WeeklyCharacterRoster
              characters={checklist.characters}
              onSelect={setSelectedCharacterId}
              selectedCharacterId={
                selectedCharacterId
              }
              taskCount={checklist.tasks.length}
            />

            {selectedCharacter && (
              <WeeklyTaskList
                character={selectedCharacter}
                onToggleAll={(completed) => {
                  void setAllTasksCompleted(
                    selectedCharacter.id,
                    completed
                  );
                }}
                onToggleTask={(
                  taskKey,
                  completed
                ) => {
                  void setTaskCompleted(
                    selectedCharacter.id,
                    taskKey,
                    completed
                  );
                }}
                pendingAction={pendingAction}
                tasks={checklist.tasks}
              />
            )}
          </div>

          <p className="weekly-period-note">
            Progress belongs to the tracking
            period starting{" "}
            {new Intl.DateTimeFormat(
              "en",
              {
                day: "2-digit",
                month: "long",
                year: "numeric"
              }
            ).format(
              new Date(
                checklist.period.startsAt
              )
            )}
            . Previous periods remain stored
            separately.
          </p>
        </>
      )}
    </>
  );
}
