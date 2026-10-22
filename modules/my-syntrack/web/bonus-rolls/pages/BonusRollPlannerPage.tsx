import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useCharacters } from "../../characters/hooks/useCharacters";
import { SeasonTabNav } from "../../season/components/SeasonTabNav";
import { BonusRollPlanForm } from "../components/BonusRollPlanForm";
import { BonusRollTable } from "../components/BonusRollTable";
import { useBonusRolls } from "../hooks/useBonusRolls";

export function BonusRollPlannerPage() {
  const { characters, isLoading: charactersLoading, error: charactersError } = useCharacters();
  const { rolls, isLoading, error, create, recordResult, clearResult, remove } = useBonusRolls();

  const pageError = error ?? charactersError;
  const planned = rolls.filter((roll) => roll.status === "PLANNED").length;
  const rolled = rolls.length - planned;
  const targetsHit = rolls.filter((roll) => roll.gotTarget).length;

  // Planned first (what is still to do), then the newest results.
  const ordered = [...rolls].sort((left, right) =>
    left.status === right.status
      ? (right.rolledAt ?? right.createdAt).localeCompare(left.rolledAt ?? left.createdAt)
      : left.status === "PLANNED" ? -1 : 1
  );

  return (
    <>
      <PageHeader
        description="Plan which boss each character spends a bonus roll on, the item it wants, and what it actually got."
        eyebrow="SEASONAL"
        summary={
          !isLoading && (
            <>
              {planned} planned · {rolled} rolled · {targetsHit} target{targetsHit === 1 ? "" : "s"} received
            </>
          )
        }
        title="Bonus Rolls"
      />

      <SeasonTabNav />

      {pageError && <StatusMessage type="error">{pageError}</StatusMessage>}

      {isLoading || charactersLoading ? (
        <LoadingPanel />
      ) : (
        <>
          <BonusRollPlanForm characters={characters} onSubmit={create} />

          <section className="panel bonus-roll-list-panel">
            <p className="panel-title">BONUS ROLLS</p>
            <BonusRollTable
              onClearResult={clearResult}
              onDelete={remove}
              onRecordResult={recordResult}
              rolls={ordered}
            />
          </section>
        </>
      )}
    </>
  );
}
