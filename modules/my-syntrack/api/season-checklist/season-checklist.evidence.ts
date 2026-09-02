import type { ResolvedTrackerDefinition } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import { SEASON_EVIDENCE_CATALOG } from "./season-evidence-catalog.js";
import { seasonGoalPresentation } from "./season-goal-presentation.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

function goalSignal(
  key: string,
  title: string,
  state: SeasonGoalSignal["state"],
  label: string,
  detail: string,
  actionLabel: string | null
): SeasonGoalSignal {
  return {
    key,
    title,
    state,
    label,
    detail,
    actionLabel
  };
}

function booleanValue(
  resolved: ResolvedTrackerDefinition | null
): boolean | null {
  const value = resolved?.state?.value;

  if (
    !resolved ||
    !resolved.state ||
    resolved.state.state !== "RECORDED" ||
    !value ||
    value.valueType !== "BOOLEAN"
  ) {
    return null;
  }

  return value.boolean;
}

function presentationForResolved(
  resolved: ResolvedTrackerDefinition | null,
  fallbackGoalKey?: string
) {
  const catalogEvidence = resolved
    ? SEASON_EVIDENCE_CATALOG.find(
        (entry) => entry.trackerKey === resolved.definition.key
      )
    : undefined;
  const goalKey =
    catalogEvidence?.goalKey ?? fallbackGoalKey ?? "evidence";
  return {
    goalKey,
    presentation: seasonGoalPresentation(goalKey)
  };
}

export function deriveBooleanEvidenceGoal(
  resolved: ResolvedTrackerDefinition | null,
  fallbackGoalKey?: string
): SeasonGoalSignal {
  const { goalKey, presentation } = presentationForResolved(
    resolved,
    fallbackGoalKey
  );
  const completed = booleanValue(resolved);

  if (completed === null) {
    return goalSignal(
      goalKey,
      presentation.title,
      "UNKNOWN",
      "?",
      presentation.detail,
      null
    );
  }

  return completed
    ? goalSignal(
        goalKey,
        presentation.title,
        "COMPLETE",
        "✓",
        presentation.detail,
        null
      )
    : goalSignal(
        goalKey,
        presentation.title,
        "INCOMPLETE",
        presentation.incompleteLabel,
        presentation.detail,
        presentation.incompleteAction
      );
}

export type PortalEvidenceCounts = {
  knownCompletedCount: number;
  knownEvidenceCount: number;
  total: number;
};

export function countPortalEvidence(
  resolved: Array<ResolvedTrackerDefinition | null>
): PortalEvidenceCounts {
  const total = resolved.length || 8;
  const knownCompletedCount = resolved.filter(
    (entry) => booleanValue(entry) === true
  ).length;
  const knownEvidenceCount = resolved.filter(
    (entry) => booleanValue(entry) !== null
  ).length;

  return { knownCompletedCount, knownEvidenceCount, total };
}

/**
 * Exact portal fractions only when every expected evidence row is known.
 * Any UNKNOWN evidence → overall UNKNOWN ("?"). Never show partial x/8.
 */
export function derivePortalsGoal(
  resolved: Array<ResolvedTrackerDefinition | null>
): SeasonGoalSignal {
  const presentation = seasonGoalPresentation("portals");
  const { knownCompletedCount, knownEvidenceCount, total } =
    countPortalEvidence(resolved);

  if (knownEvidenceCount < total) {
    return goalSignal(
      "portals",
      presentation.title,
      "UNKNOWN",
      "?",
      presentation.detail,
      null
    );
  }

  if (knownCompletedCount === total) {
    return goalSignal(
      "portals",
      presentation.title,
      "COMPLETE",
      `✓ ${total}/${total}`,
      presentation.detail,
      null
    );
  }

  return goalSignal(
    "portals",
    presentation.title,
    "INCOMPLETE",
    `${knownCompletedCount}/${total}`,
    presentation.detail,
    presentation.incompleteAction
  );
}

/**
 * CE is a stronger optional complete signal.
 * AOTC unknown + CE false does not prove AOTC open → UNKNOWN.
 */
export function deriveRaidGoal(
  aotc: ResolvedTrackerDefinition | null,
  ce: ResolvedTrackerDefinition | null
): SeasonGoalSignal {
  const aotcValue = booleanValue(aotc);
  const ceValue = booleanValue(ce);
  const detail = "Ula'tek raid milestones for Midnight Season 2";

  if (ceValue === true) {
    return goalSignal("raid", "Raid", "COMPLETE", "✓ CE", detail, null);
  }

  if (aotcValue === true) {
    return goalSignal("raid", "Raid", "COMPLETE", "✓ AOTC", detail, null);
  }

  if (aotcValue === false) {
    return goalSignal(
      "raid",
      "Raid",
      "INCOMPLETE",
      "AOTC open",
      detail,
      "Earn AOTC: Ula'tek"
    );
  }

  return goalSignal("raid", "Raid", "UNKNOWN", "?", detail, null);
}

export function deriveWarbandBooleanGoal(
  signals: SeasonGoalSignal[],
  goalKey: string
): SeasonGoalSignal {
  const presentation = seasonGoalPresentation(goalKey);
  const hasComplete = signals.some((signal) => signal.state === "COMPLETE");
  const knownIncomplete = signals.filter(
    (signal) => signal.state === "INCOMPLETE"
  );
  const allUnknown =
    signals.length === 0 ||
    signals.every((signal) => signal.state === "UNKNOWN");

  if (hasComplete) {
    return goalSignal(
      goalKey,
      presentation.title,
      "COMPLETE",
      "✓",
      presentation.detail,
      null
    );
  }

  if (allUnknown) {
    return goalSignal(
      goalKey,
      presentation.title,
      "UNKNOWN",
      "?",
      presentation.detail,
      null
    );
  }

  if (knownIncomplete.length > 0) {
    return goalSignal(
      goalKey,
      presentation.title,
      "INCOMPLETE",
      presentation.incompleteLabel,
      presentation.detail,
      presentation.incompleteAction
    );
  }

  return goalSignal(
    goalKey,
    presentation.title,
    "UNKNOWN",
    "?",
    presentation.detail,
    null
  );
}

export const deriveCatalystGoal = (
  resolved: ResolvedTrackerDefinition | null
) => deriveBooleanEvidenceGoal(resolved, "serpent-scion");

export const deriveCrackedGoal = (
  resolved: ResolvedTrackerDefinition | null
) => deriveBooleanEvidenceGoal(resolved, "cracked-keystone");

export const deriveNemesisGoal = (
  resolved: ResolvedTrackerDefinition | null
) => deriveBooleanEvidenceGoal(resolved, "nemesis-aztarec");
