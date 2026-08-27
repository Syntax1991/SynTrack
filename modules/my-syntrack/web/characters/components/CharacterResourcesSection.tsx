import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type {
  ResourceItemView,
  ResourceOverviewState
} from "../../overview/types/overview.types";

type CharacterResourcesSectionProps = {
  resources: ResourceOverviewState;
};

/*
 * Factual values only - never a derived/invented maximum (e.g. "2/4
 * Sparks" when the season maximum isn't reliably known). A weekly
 * fraction is shown only when both the earned and cap values are
 * actually known; otherwise just the current owned/wallet amount.
 */
function formatResourceValue(
  item: ResourceItemView
): string {
  if (!item.snapshot) {
    return "Not tracked";
  }

  const {
    quantity,
    weeklyQuantity,
    maxWeeklyQuantity
  } = item.snapshot;

  if (quantity === null) {
    return "Tracked, no data yet";
  }

  if (
    weeklyQuantity !== null &&
    maxWeeklyQuantity !== null
  ) {
    return `${quantity} · weekly ${weeklyQuantity}/${maxWeeklyQuantity}`;
  }

  return `Owned: ${quantity}`;
}

/*
 * No dedicated currency page in V1 (see the Currency & Weekly Resource
 * Tracking audit) - this compact list is the only place a character's
 * tracked resource values are shown. Only resources with a real
 * captured snapshot are listed; a definition the character has no data
 * for yet is omitted rather than shown as a fabricated zero row.
 */
export function CharacterResourcesSection({
  resources
}: CharacterResourcesSectionProps) {
  const trackedItems = resources.items.filter(
    (item) => item.snapshot !== null
  );

  return (
    <section className="character-detail-section">
      <h2>Resources</h2>

      {trackedItems.length === 0 ? (
        <p className="muted-text">
          No resources tracked yet.
        </p>
      ) : (
        <ul className="character-resource-list">
          {trackedItems.map((item) => (
            <li
              className="character-resource-row"
              key={item.resourceDefinitionId}
            >
              <span className="character-resource-name">
                {item.name}
              </span>

              <span className="character-resource-value">
                {formatResourceValue(item)}
              </span>

              {item.attentionNeeded && (
                <StatusToken
                  token={{
                    symbol: "!",
                    tone: "attention",
                    title:
                      "Not complete this week"
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
