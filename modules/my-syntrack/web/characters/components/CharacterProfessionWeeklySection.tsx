import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type { CellToken } from "../../../../../apps/web/src/shared/types/cellToken";
import type {
  ProfessionWeeklyOverviewState,
  ProfessionWeeklySourceStatus
} from "../../overview/types/overview.types";

type CharacterProfessionWeeklySectionProps = {
  professionWeekly: ProfessionWeeklyOverviewState;
};

function sourceToken(
  state: ProfessionWeeklySourceStatus["state"]
): CellToken {
  if (state === "COMPLETE") {
    return {
      symbol: "✓",
      tone: "ready",
      title: "Complete this week"
    };
  }

  if (state === "INCOMPLETE") {
    return {
      symbol: "!",
      tone: "attention",
      title: "Not complete this week"
    };
  }

  return {
    symbol: "?",
    tone: "unknown",
    title: "No evidence captured yet"
  };
}

/*
 * Drops shows "current/max" when both are known, never a fabricated
 * "0/x" - a missing definition or missing evidence renders the same
 * unknown token Prof KP sources use, just without a fraction attached.
 */
function dropsLabel(
  drops: ProfessionWeeklySourceStatus
): string | null {
  if (drops.currentValue === null || drops.maxValue === null) {
    return null;
  }

  return `${drops.currentValue}/${drops.maxValue}`;
}

/*
 * Explains the compact Weekly/Overview Prof KP + Drops columns without
 * duplicating their aggregation logic - every value here is read
 * straight from ProfessionWeeklyStatusService's read model. A
 * profession with zero enabled sources this season never appears at
 * all (NOT_APPLICABLE by construction), rather than a fabricated row.
 */
export function CharacterProfessionWeeklySection({
  professionWeekly
}: CharacterProfessionWeeklySectionProps) {
  if (professionWeekly.professions.length === 0) {
    return (
      <section className="character-detail-section">
        <h2>Profession weekly</h2>

        <p className="muted-text">
          No profession weekly sources tracked yet.
        </p>
      </section>
    );
  }

  return (
    <section className="character-detail-section">
      <h2>Profession weekly</h2>

      <div className="character-profession-weekly-list">
        {professionWeekly.professions.map((profession) => (
          <div
            className="character-profession-weekly-group"
            key={profession.professionKey}
          >
            <h3>{profession.name}</h3>

            <ul className="character-profession-weekly-sources">
              {profession.sources.map((source) => (
                <li key={source.sourceKey}>
                  <span>{source.name}</span>

                  <StatusToken
                    token={sourceToken(source.state)}
                  />
                </li>
              ))}

              {profession.drops && (
                <li className="character-profession-weekly-drops">
                  <span>Knowledge Drops</span>

                  {dropsLabel(profession.drops) && (
                    <span className="character-profession-weekly-drops-value">
                      {dropsLabel(profession.drops)}
                    </span>
                  )}

                  <StatusToken
                    token={sourceToken(
                      profession.drops.state
                    )}
                  />
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
