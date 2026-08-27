import { Link } from "react-router-dom";
import type { CharacterWeeklyState } from "../../overview/types/overview.types";
import { formatResetCountdown } from "../../overview/utils/resetContext";

type CharacterThisWeekSectionProps = {
  character: CharacterWeeklyState;
  period: { endsAt: string };
};

/*
 * A compact weekly summary that deep-links into the real Weekly
 * Checklist/Vault pages - never a re-rendered copy of their full
 * matrix/run log. Vault only shows a slot count when the domain has
 * actually proven it (UNKNOWN never becomes a fake 0/3).
 */
export function CharacterThisWeekSection({
  character,
  period
}: CharacterThisWeekSectionProps) {
  return (
    <section className="character-detail-section">
      <h2>This week</h2>

      <div className="character-this-week-grid">
        <Link
          className="character-this-week-cell"
          to="/weekly-checklist"
        >
          <span>Weekly Checklist</span>

          <strong>
            {character.weekly.total ===
            0
              ? "—"
              : `${character.weekly.completed}/${character.weekly.total}`}
          </strong>
        </Link>

        <Link
          className="character-this-week-cell"
          to="/vault-mythic-plus"
        >
          <span>Vault</span>

          {character.vault.state ===
          "UNKNOWN" ? (
            <strong className="muted-text">
              Unknown
            </strong>
          ) : (
            <>
              <strong>
                {
                  character.vault
                    .unlockedSlots
                }
                /
                {
                  character.vault
                    .slotsTotal
                }
              </strong>

              {character.vault
                .highestKeyLevel !==
                null && (
                <small>
                  highest +
                  {
                    character.vault
                      .highestKeyLevel
                  }
                </small>
              )}
            </>
          )}
        </Link>

        <div className="character-this-week-cell character-this-week-reset">
          <span>Reset</span>

          <strong>
            {formatResetCountdown(
              period.endsAt,
              new Date()
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}
