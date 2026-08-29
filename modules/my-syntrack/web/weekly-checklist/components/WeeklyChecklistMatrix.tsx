import { Link } from "react-router-dom";
import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import { getClassColor } from "../../../../../apps/web/src/shared/utils/classColors";
import type {
  ProfessionWeeklyAggregate,
  WeeklyChecklistCharacter,
  WeeklyChecklistTask
} from "../types/weeklyChecklist.types";
import { getCompactTaskLabel } from "../utils/taskLabels";

/*
 * Automatic Quest/Treatise/Drops columns are additive and read-only
 * next to the existing manual "profession-knowledge" task - see the
 * profession weekly correctness follow-up. Quest and Treatise are
 * shown separately (never merged into one "Prof KP" number) so the
 * user can tell which one is actually missing. They don't replace the
 * manual task until the automatic version is fully live-verified
 * across every profession, so a character can show both at once.
 */
function aggregateToken(
  aggregate: ProfessionWeeklyAggregate,
  label: string
) {
  if (aggregate.applicableTotal === 0) {
    return {
      symbol: "–",
      tone: "not-tracked" as const,
      title: `${label} - not tracked`
    };
  }

  if (aggregate.incompleteCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "attention" as const,
      title: `${label} - ${aggregate.incompleteCount} incomplete`
    };
  }

  if (aggregate.unknownCount > 0) {
    return {
      symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
      tone: "unknown" as const,
      title: `${label} - ${aggregate.unknownCount} unknown`
    };
  }

  return {
    symbol: `${aggregate.completeCount}/${aggregate.applicableTotal}`,
    tone: "ready" as const,
    title: `${label} - complete`
  };
}

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

            <th
              className="matrix-col-narrow"
              title="Automatic: weekly profession quest, captured via addon (not the manual Profession knowledge task above)"
            >
              QUEST
            </th>

            <th
              className="matrix-col-narrow"
              title="Automatic: profession Treatise, captured via addon"
            >
              TREAT.
            </th>

            <th
              className="matrix-col-narrow"
              title="Automatic: weekly profession Knowledge Drops progress, captured via addon (never affects Quest/Treatise)"
            >
              DROPS
            </th>

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
                      <Link
                        className="matrix-character-link"
                        style={{
                          color:
                            getClassColor(
                              character.className
                            )
                        }}
                        to={`/characters/${character.id}`}
                      >
                        {
                          character.name
                        }
                      </Link>

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
                      token={aggregateToken(
                        character.professionWeekly
                          .quest,
                        "Weekly Quest"
                      )}
                    />
                  </td>

                  <td className="matrix-col-narrow">
                    <StatusToken
                      token={aggregateToken(
                        character.professionWeekly
                          .treatise,
                        "Treatise"
                      )}
                    />
                  </td>

                  <td className="matrix-col-narrow">
                    <StatusToken
                      token={aggregateToken(
                        character.professionWeekly
                          .drops,
                        "Knowledge Drops"
                      )}
                    />
                  </td>

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
