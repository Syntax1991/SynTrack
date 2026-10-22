import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { useCharacters } from "../../characters/hooks/useCharacters";
import { SeasonTabNav } from "../../season/components/SeasonTabNav";
import { BonusRollBoard } from "../components/BonusRollBoard";
import { BonusRollPlanForm } from "../components/BonusRollPlanForm";
import { BonusRollStats } from "../components/BonusRollStats";
import { useBonusRolls } from "../hooks/useBonusRolls";

export function BonusRollPlannerPage() {
  const { characters, isLoading: charactersLoading, error: charactersError } = useCharacters();
  const { rolls, isLoading, error, create, recordResult, clearResult, remove } = useBonusRolls();

  const pageError = error ?? charactersError;

  return (
    <>
      <PageHeader
        description="Plan which boss each character spends a bonus roll on, the item it is after, and what actually dropped."
        eyebrow="SEASON"
        title="Bonus Rolls"
      />

      <SeasonTabNav />

      {pageError && <StatusMessage type="error">{pageError}</StatusMessage>}

      {isLoading || charactersLoading ? (
        <LoadingPanel />
      ) : (
        <>
          <BonusRollStats rolls={rolls} />

          <div className="bonus-roll-layout">
            <BonusRollBoard
              onClearResult={clearResult}
              onDelete={remove}
              onRecordResult={recordResult}
              rolls={rolls}
            />

            <aside className="bonus-roll-composer">
              <BonusRollPlanForm characters={characters} onSubmit={create} />
            </aside>
          </div>
        </>
      )}
    </>
  );
}
