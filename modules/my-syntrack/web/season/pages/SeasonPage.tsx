import { useState } from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { ManageGoalsModal } from "../../../web/season-goal-preference/components/ManageGoalsModal.js";
import { SeasonChecklistMatrix } from "../components/SeasonChecklistMatrix";
import { SeasonWarbandGoalsPanel } from "../components/SeasonWarbandGoalsPanel";
import { useSeasonChecklist } from "../hooks/useSeasonChecklist";

export function SeasonPage() {
  const { checklist, isLoading, error, reload } = useSeasonChecklist();
  const [isManagingGoals, setIsManagingGoals] = useState(false);

  const seasonLabel = checklist?.season
    ? checklist.season.name
    : "Active season";

  return (
    <>
      <PageHeader
        actions={
          <button
            aria-label="Manage Goals"
            className="page-icon-button"
            onClick={() => setIsManagingGoals(true)}
            title="Manage Goals"
            type="button"
          >
            <svg
              aria-hidden="true"
              className="nav-icon"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        }
        description="Seasonal Character and Warband goals. Weekly reset work stays in Weeklies."
        eyebrow="SEASONAL CHECKLIST"
        summary={
          checklist && (
            <>
              {seasonLabel}
              {" · "}
              {checklist.summary.characterCount} characters
              {" · "}
              {checklist.summary.goalsOpen} goals open
              {" · "}
              {checklist.summary.goalsComplete} complete
              {" · "}
              {checklist.summary.goalsUnknown} unknown
            </>
          )
        }
        title="Season"
      />

      {isManagingGoals && (
        <ManageGoalsModal
          onClose={() => {
            setIsManagingGoals(false);
            void reload();
          }}
        />
      )}

      {error && <StatusMessage type="error">{error}</StatusMessage>}

      {isLoading || !checklist ? (
        <LoadingPanel />
      ) : (
        <>
          <section className="panel matrix-panel season-matrix-panel">
            <p className="panel-title">CHARACTER SEASON GOALS</p>
            <SeasonChecklistMatrix characters={checklist.characters} />
          </section>

          <SeasonWarbandGoalsPanel warbandGoals={checklist.warbandGoals} />
        </>
      )}
    </>
  );
}
