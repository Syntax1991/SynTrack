import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type {
  WeeklyChecklistCharacter,
  WeeklyChecklistTask
} from "../types/weeklyChecklist.types";
import { getCompactTaskLabel } from "../utils/taskLabels";

type WeeklyChecklistMatrixProps = {
  characters: WeeklyChecklistCharacter[];
  tasks: WeeklyChecklistTask[];
  pendingAction: string | null;
  onToggleTask: (
    characterId: string,
    taskKey: string,
    completed: boolean
  ) => void;
  onToggleAll: (
    characterId: string,
    completed: boolean
  ) => void;
};

/*
 * Account-wide checklist: one character = one row, each task a
 * directly clickable compact cell - the user can check tasks across
 * every character without first selecting one, matching the
 * spreadsheet's biggest advantage over the old select-then-edit panel.
 */
export function WeeklyChecklistMatrix({
  characters,
  tasks,
  pendingAction,
  onToggleTask,
  onToggleAll
}: WeeklyChecklistMatrixProps) {
  if (characters.length === 0) {
    return (
      <div className="empty-state">
        No characters match this filter.
      </div>
    );
  }

  return (
    <div className="table-scroll matrix-scroll">
      <table className="dense-matrix">
        <thead>
          <tr>
            <th>Character</th>

            {tasks.map((task) => (
              <th
                className="matrix-col-narrow"
                key={task.key}
                title={
                  task.description
                }
              >
                {getCompactTaskLabel(
                  task
                )}
              </th>
            ))}

            <th className="matrix-col-narrow">
              Progress
            </th>

            <th
              aria-label="Actions"
              className="matrix-col-action"
            />
          </tr>
        </thead>

        <tbody>
          {characters.map(
            (character) => {
              const completedCount =
                character
                  .completedTaskKeys
                  .length;

              const allCompleted =
                tasks.length > 0 &&
                completedCount ===
                  tasks.length;

              return (
                <tr
                  className={
                    allCompleted
                      ? "is-complete"
                      : undefined
                  }
                  key={character.id}
                >
                  <td>
                    <div className="matrix-identity">
                      <strong
                        style={{
                          color:
                            getClassColor(
                              character.className
                            )
                        }}
                      >
                        {
                          character.name
                        }
                      </strong>

                      <span>
                        {
                          character.className
                        }
                        {" · "}
                        {
                          character.realm
                        }
                      </span>
                    </div>
                  </td>

                  {tasks.map(
                    (task) => {
                      const completed =
                        character.completedTaskKeys.includes(
                          task.key
                        );

                      const actionKey =
                        `${character.id}:${task.key}`;

                      const isPending =
                        pendingAction ===
                          actionKey ||
                        pendingAction ===
                          `${character.id}:all`;

                      return (
                        <td
                          className="matrix-col-narrow"
                          key={task.key}
                        >
                          <button
                            className="matrix-token-button"
                            disabled={
                              pendingAction !==
                              null
                            }
                            onClick={() =>
                              onToggleTask(
                                character.id,
                                task.key,
                                !completed
                              )
                            }
                            type="button"
                          >
                            <StatusToken
                              token={
                                isPending
                                  ? {
                                      symbol:
                                        "…",
                                      tone: "progress",
                                      title:
                                        "Saving…"
                                    }
                                  : completed
                                    ? {
                                        symbol:
                                          "✓",
                                        tone: "ready",
                                        title: `${task.title} - complete`
                                      }
                                    : {
                                        symbol:
                                          "○",
                                        tone: "attention",
                                        title: `${task.title} - incomplete`
                                      }
                              }
                            />
                          </button>
                        </td>
                      );
                    }
                  )}

                  <td className="matrix-col-narrow">
                    <StatusToken
                      token={{
                        symbol: `${completedCount}/${tasks.length}`,
                        tone: allCompleted
                          ? "ready"
                          : "progress",
                        title: `${completedCount} of ${tasks.length} weekly tasks complete`
                      }}
                    />
                  </td>

                  <td className="matrix-col-action">
                    <button
                      className="text-button"
                      disabled={
                        pendingAction !==
                        null
                      }
                      onClick={() =>
                        onToggleAll(
                          character.id,
                          !allCompleted
                        )
                      }
                      type="button"
                    >
                      {allCompleted
                        ? "Clear"
                        : "Complete all"}
                    </button>
                  </td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}
