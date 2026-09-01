import { Link } from "react-router-dom";
import { LoadingPanel } from "../../../../../apps/web/src/shared/components/LoadingPanel";
import { PageHeader } from "../../../../../apps/web/src/shared/components/PageHeader";
import { StatusMessage } from "../../../../../apps/web/src/shared/components/StatusMessage";
import { WeeklyChecklistMatrix } from "../components/WeeklyChecklistMatrix";
import { useWeeklyChecklist } from "../hooks/useWeeklyChecklist";
import { WeekliesTabNav } from "../../shared/components/WeekliesTabNav";

export function WeeklyChecklistPage() {
  const { checklist, isLoading, error } = useWeeklyChecklist();

  return (
    <>
      <WeekliesTabNav />

      <PageHeader
        actions={
          <Link className="button button-secondary" to="/characters">
            Manage characters
          </Link>
        }
        description="Gameplay recurring work across the roster. Detailed profession weekly work lives in Professions."
        eyebrow="WEEKLY RESET"
        title="Weeklies"
      />

      {error && <StatusMessage type="error">{error}</StatusMessage>}

      {isLoading || !checklist ? (
        <LoadingPanel />
      ) : checklist.characters.length === 0 ? (
        <section className="panel weekly-empty-state">
          <p className="eyebrow">ROSTER REQUIRED</p>
          <h2>Add your first character</h2>
          <p>
            Weekly progress is tracked per character. Add or sync a character
            to begin.
          </p>
          <Link className="button button-primary" to="/characters">
            Open character roster
          </Link>
        </section>
      ) : (
        <section className="panel matrix-panel">
          <WeeklyChecklistMatrix characters={checklist.characters} />
        </section>
      )}
    </>
  );
}
