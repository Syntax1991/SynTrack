import { useState } from "react";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { TrackerManagerDrawer } from "../../trackers/components/TrackerManagerDrawer";
import { PriorityActionLayer } from "../components/PriorityActionLayer";
import { AccountResourcesSummary } from "../components/AccountResourcesSummary";
import { AttentionStrip } from "../components/AttentionStrip";
import { CharacterWeeklyMatrix } from "../components/CharacterWeeklyMatrix";
import { useOverview } from "../hooks/useOverview";
import { formatResetCountdown } from "../utils/resetContext";

/*
 * The Character Control Matrix is the primary product surface here -
 * this page is a thin shell (header, a one-line summary/toolbar, a
 * compact attention strip) around it, not a dashboard with a table
 * underneath.
 */
export function OverviewPage() {
  const {
    overview,
    isLoading,
    error,
    refetch
  } = useOverview();

  const [
    isTrackerManagerOpen,
    setIsTrackerManagerOpen
  ] = useState(false);

  return (
    <>
      <PageHeader
        description={
          overview
            ? formatResetCountdown(
                overview.summary
                  .period.endsAt,
                new Date()
              )
            : "Your weekly control center across every tracked character."
        }
        eyebrow="MY SYNTRACK"
        title="Overview"
      />

      {error && (
        <StatusMessage type="error">
          {error}
        </StatusMessage>
      )}

      {isLoading || !overview ? (
        <LoadingPanel />
      ) : (
        <>
          <PriorityActionLayer
            priorities={overview.priorities}
          />

          <AttentionStrip
            attentionItems={
              overview.attentionItems
            }
          />

          <AccountResourcesSummary
            accountResources={
              overview.accountResources
            }
          />

          <CharacterWeeklyMatrix
            characters={
              overview.characters
            }
            onOpenTrackerManager={() =>
              setIsTrackerManagerOpen(
                true
              )
            }
            onTrackerChanged={
              refetch
            }
            resetLabel={formatResetCountdown(
              overview.summary.period.endsAt,
              new Date()
            )}
            trackerColumns={
              overview.trackerColumns
            }
          />
        </>
      )}

      {isTrackerManagerOpen && (
        <TrackerManagerDrawer
          onClose={() =>
            setIsTrackerManagerOpen(
              false
            )
          }
          onDefinitionsChanged={
            refetch
          }
        />
      )}
    </>
  );
}
