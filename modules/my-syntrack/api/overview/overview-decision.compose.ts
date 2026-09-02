import type {
  OverviewActionCandidate,
  OverviewDecisionHorizon,
  OverviewDecisionResponse,
  OverviewDecisionSummaries
} from "./overview-decision.types.js";

const HORIZON_RANK: Record<OverviewDecisionHorizon, number> = {
  WEEKLY: 0,
  SEASONAL: 1,
  PERMANENT: 2
};

export function compareOverviewActionCandidates(
  left: OverviewActionCandidate,
  right: OverviewActionCandidate
): number {
  const horizonDiff =
    HORIZON_RANK[left.horizon] - HORIZON_RANK[right.horizon];

  if (horizonDiff !== 0) {
    return horizonDiff;
  }

  const localDiff = left.localOrder - right.localOrder;

  if (localDiff !== 0) {
    return localDiff;
  }

  const nameDiff = left.characterName.localeCompare(
    right.characterName,
    "en"
  );

  if (nameDiff !== 0) {
    return nameDiff;
  }

  const actionDiff = left.action.localeCompare(right.action, "en");

  if (actionDiff !== 0) {
    return actionDiff;
  }

  return left.characterId.localeCompare(right.characterId, "en");
}

export function sortOverviewActionCandidates(
  actions: OverviewActionCandidate[]
): OverviewActionCandidate[] {
  return [...actions].sort(compareOverviewActionCandidates);
}

export function resolveOverviewEmptyState(
  actions: OverviewActionCandidate[],
  unresolved: number
): OverviewDecisionResponse["emptyState"] {
  if (actions.length > 0) {
    return "NO_OPEN_ACTIONS";
  }

  if (unresolved > 0) {
    return "NO_KNOWN_ACTIONS_UNRESOLVED";
  }

  return "NO_OPEN_ACTIONS";
}

export function buildOverviewDecisionResponse(input: {
  summaries: OverviewDecisionSummaries;
  actions: OverviewActionCandidate[];
}): OverviewDecisionResponse {
  const actions = sortOverviewActionCandidates(input.actions);

  return {
    summaries: input.summaries,
    actions,
    emptyState: resolveOverviewEmptyState(
      actions,
      input.summaries.unresolved
    )
  };
}

export function overviewHorizonLabel(
  horizon: OverviewDecisionHorizon
): string {
  if (horizon === "WEEKLY") {
    return "THIS WEEK";
  }

  if (horizon === "SEASONAL") {
    return "SEASON";
  }

  return "SETUP";
}

export function overviewSourceLabel(
  source: OverviewActionCandidate["source"]
): string {
  return source;
}
