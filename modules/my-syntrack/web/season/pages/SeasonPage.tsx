import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { SeasonChecklistMatrix } from "../components/SeasonChecklistMatrix";
import { SeasonWarbandGoalsPanel } from "../components/SeasonWarbandGoalsPanel";
import { useSeasonChecklist } from "../hooks/useSeasonChecklist";

export function SeasonPage() {
  const { checklist, isLoading, error } = useSeasonChecklist();

  const seasonLabel = checklist?.season
    ? checklist.season.name
    : "Active season";

  return (
    <>
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/weekly-checklist">
            Open Weeklies
          </Link>
        }
        description="Seasonal Character and Warband goals. Weekly reset work stays in Weeklies."
        eyebrow="SEASONAL CHECKLIST"
        title="Season"
      />

      {error && <StatusMessage type="error">{error}</StatusMessage>}

      {isLoading || !checklist ? (
        <LoadingPanel />
      ) : (
        <>
          <section className="panel">
            <p className="eyebrow">{seasonLabel}</p>
            <div className="matrix-summary">
              {checklist.summary.characterCount} characters ·{" "}
              {checklist.summary.goalsOpen} Character goals open ·{" "}
              {checklist.summary.goalsComplete} complete ·{" "}
              {checklist.summary.goalsUnknown} unknown ·{" "}
              {checklist.summary.warbandGoalsPending} Warband goals pending
              capture
            </div>
          </section>

          <section className="panel matrix-panel">
            <p className="eyebrow">CHARACTER SEASON GOALS</p>
            <SeasonChecklistMatrix characters={checklist.characters} />
          </section>

          <SeasonWarbandGoalsPanel
            blockedCharacterGoals={checklist.blockedCharacterGoals}
            warbandGoals={checklist.warbandGoals}
          />
        </>
      )}
    </>
  );
}
