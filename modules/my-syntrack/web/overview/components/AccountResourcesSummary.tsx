import { StatusToken } from "../../../../../apps/web/src/shared/components/StatusToken";
import type { AccountResourceView } from "../types/overview.types";

type AccountResourcesSummaryProps = {
  accountResources: AccountResourceView[];
};

/*
 * Warband/account-wide resources display exactly once here - never
 * repeated per character (see the Currency & Weekly Resource Tracking
 * audit's account-wide semantics). A resource whose ownership evidence
 * disagreed with its configured scope shows as UNKNOWN rather than a
 * distrusted number, with a title explaining why.
 */
export function AccountResourcesSummary({
  accountResources
}: AccountResourcesSummaryProps) {
  if (accountResources.length === 0) {
    return null;
  }

  return (
    <section className="overview-account-resources">
      <h2>Account-wide resources</h2>

      <ul className="character-resource-list">
        {accountResources.map((resource) => (
          <li
            className="character-resource-row"
            key={resource.resourceDefinitionId}
          >
            <span className="character-resource-name">
              {resource.name}
            </span>

            {resource.snapshot ? (
              <span className="character-resource-value">
                {resource.snapshot.quantity ??
                  "—"}
              </span>
            ) : (
              <StatusToken
                token={{
                  symbol: "?",
                  tone: "unknown",
                  title: resource.ownershipMismatch
                    ? "Ownership evidence disagreed with the configured account-wide scope"
                    : "No data yet"
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
