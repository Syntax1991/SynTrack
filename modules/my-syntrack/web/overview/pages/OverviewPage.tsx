import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { AttentionQueue } from "../components/AttentionQueue";
import { CharacterWeeklyMatrix } from "../components/CharacterWeeklyMatrix";
import { OverviewSummaryCards } from "../components/OverviewSummaryCards";
import { useOverview } from "../hooks/useOverview";
import { formatResetCountdown } from "../utils/resetContext";

export function OverviewPage() {
  const { overview, isLoading, error } =
    useOverview();

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
          <OverviewSummaryCards
            summary={
              overview.summary
            }
          />

          <AttentionQueue
            attentionItems={
              overview.attentionItems
            }
          />

          <CharacterWeeklyMatrix
            characters={
              overview.characters
            }
          />
        </>
      )}
    </>
  );
}
