import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { OverviewDecisionStrip } from "../components/OverviewDecisionStrip";
import { OverviewGameplayPriorities } from "../components/OverviewGameplayPriorities";
import { OverviewProfessionWork } from "../components/OverviewProfessionWork";
import { OverviewSetupAttention } from "../components/OverviewSetupAttention";
import { useOverviewDecisions } from "../hooks/useOverviewDecisions";

/**
 * Overview Decision Cockpit — Character-level priorities over raw candidates.
 * Specialist matrices stay on Weeklies / Season / Professions.
 */
export function OverviewPage() {
  const { overview, isLoading, error } = useOverviewDecisions();

  return (
    <>
      <PageHeader
        description="What should I do next across the Warband?"
        eyebrow="MY SYNTRACK"
        title="Overview"
      />

      {error && <StatusMessage type="error">{error}</StatusMessage>}

      {isLoading || !overview ? (
        <LoadingPanel />
      ) : (
        <>
          <OverviewDecisionStrip summaries={overview.summaries} />

          {overview.projection.gameplayPriorities.length === 0 &&
          overview.projection.professionWork.length === 0 &&
          overview.projection.setupAttention.length === 0 ? (
            <section className="panel overview-decision-panel">
              <div className="empty-state">
                {overview.emptyState === "NO_KNOWN_ACTIONS_UNRESOLVED"
                  ? `No known actions · ${overview.summaries.unresolved} unresolved`
                  : "No open actions"}
              </div>
            </section>
          ) : (
            <>
              {overview.projection.gameplayPriorities.length > 0 ? (
                <OverviewGameplayPriorities
                  rows={overview.projection.gameplayPriorities}
                />
              ) : null}
              <OverviewProfessionWork
                rows={overview.projection.professionWork}
              />
              <OverviewSetupAttention
                rows={overview.projection.setupAttention}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
