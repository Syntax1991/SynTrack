import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { OverviewActionTable } from "../components/OverviewActionTable";
import { OverviewDecisionStrip } from "../components/OverviewDecisionStrip";
import { useOverviewDecisions } from "../hooks/useOverviewDecisions";

/**
 * Overview Decision Engine V1 — account-wide next-action cockpit.
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
          <OverviewActionTable overview={overview} />
        </>
      )}
    </>
  );
}
