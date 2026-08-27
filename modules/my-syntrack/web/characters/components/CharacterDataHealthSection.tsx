import type { CharacterDataHealth } from "../../overview/types/overview.types";

type CharacterDataHealthSectionProps = {
  health: CharacterDataHealth;
};

function formatLine(
  state: CharacterDataHealth["character"]["state"],
  lastSyncedAt: string | null
): string {
  if (state === "MANUAL") {
    return "Manual";
  }

  if (state === "NOT_TRACKED") {
    return "Not tracked";
  }

  if (state === "NEVER_CAPTURED") {
    return "Never captured";
  }

  if (state === "PARTIAL") {
    return "Partial";
  }

  if (!lastSyncedAt) {
    return state === "FRESH"
      ? "Up to date"
      : "Stale";
  }

  const relative = new Intl.RelativeTimeFormat(
    "en",
    { numeric: "auto" }
  );

  const diffMs =
    Date.now() -
    new Date(lastSyncedAt).getTime();

  const diffHours = Math.round(
    diffMs / (60 * 60 * 1000)
  );

  const label =
    diffHours < 1
      ? "just now"
      : diffHours < 24
        ? relative.format(
            -diffHours,
            "hour"
          )
        : relative.format(
            -Math.round(
              diffHours / 24
            ),
            "day"
          );

  return state === "FRESH"
    ? `Updated ${label}`
    : `Stale (updated ${label})`;
}

/*
 * A compact freshness summary, not a sync-status dashboard - three
 * lines, each honestly distinguishing "not tracked here" from "never
 * captured yet" from "captured but stale" from "fresh". Manual domains
 * (Weeklies/Vault/Trackers) are intentionally not shown here at all;
 * only domains with a real capture-timestamp concept are.
 */
export function CharacterDataHealthSection({
  health
}: CharacterDataHealthSectionProps) {
  return (
    <section className="character-detail-section">
      <h2>Data</h2>

      <ul className="character-health-list">
        <li>
          <span>Character</span>

          <span className="character-health-value">
            {formatLine(
              health.character.state,
              health.character
                .lastSyncedAt
            )}
          </span>
        </li>

        <li>
          <span>Professions</span>

          <span className="character-health-value">
            {formatLine(
              health.professions
                .state,
              null
            )}
          </span>
        </li>

        <li>
          <span>Gear</span>

          <span className="character-health-value">
            {formatLine(
              health.gear.state,
              health.gear.lastSyncedAt
            )}
          </span>
        </li>
      </ul>
    </section>
  );
}
