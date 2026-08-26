import type { OverviewDomainState } from "../types/overview.types";

const stateLabel: Record<
  OverviewDomainState,
  string
> = {
  READY: "Ready",
  IN_PROGRESS: "In progress",
  ATTENTION: "Attention",
  UNKNOWN: "Unknown",
  NOT_TRACKED: "Not tracked"
};

const stateClassName: Record<
  OverviewDomainState,
  string
> = {
  READY: "overview-status ready",
  IN_PROGRESS:
    "overview-status in-progress",
  ATTENTION:
    "overview-status attention",
  UNKNOWN:
    "overview-status unknown",
  NOT_TRACKED:
    "overview-status not-tracked"
};

export function OverviewStatusBadge({
  state,
  detail
}: {
  state: OverviewDomainState;
  detail?: string;
}) {
  return (
    <span
      className={
        stateClassName[state]
      }
    >
      {detail ?? stateLabel[state]}
    </span>
  );
}
