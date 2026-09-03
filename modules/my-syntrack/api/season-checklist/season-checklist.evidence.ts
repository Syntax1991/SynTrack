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

/**
 * CE is a stronger optional complete signal.
 * AOTC unknown + CE false does not prove AOTC open → UNKNOWN.
 */
export type SeasonRaidGoalTarget = "AOTC" | "CE" | "OFF";

/**
 * Raid target is configurable via Manage Goals (default AOTC). "OFF"
 * excludes Raid from Status/Action entirely (NOT_APPLICABLE), same
 * convention as a disabled boolean goal.
 */
export function deriveRaidGoal(
  aotc: ResolvedTrackerDefinition | null,
  ce: ResolvedTrackerDefinition | null,
  target: SeasonRaidGoalTarget = "AOTC"
): SeasonGoalSignal {
  const detail = "Ula'tek raid milestones for Midnight Season 2";

  if (target === "OFF") {
    return goalSignal("raid", "Raid", "NOT_APPLICABLE", "—", detail, null);
  }

  const aotcValue = booleanValue(aotc);
  const ceValue = booleanValue(ce);

  if (target === "CE") {
    if (ceValue === true) {
      return goalSignal("raid", "Raid", "COMPLETE", "✓ CE", detail, null);
    }

    if (ceValue === false) {
      return goalSignal(
        "raid",
        "Raid",
        "INCOMPLETE",
        "✕ CE",
        detail,
        "Earn Cutting Edge: Ula'tek"
      );
    }

    return goalSignal("raid", "Raid", "UNKNOWN", "?", detail, null);
  }

  // target === "AOTC" — CE still counts as a stronger complete signal.
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
      "✕ AOTC",
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

/**
 * Warband portal aggregate: one call to deriveWarbandBooleanGoal per
 * portal (aggregating that single achievement across every Character's
 * accountCompleted-sourced signal), then combined into a fraction — mirrors
 * derivePortalsGoal's counting rules but over pre-aggregated Warband states
 * instead of one Character's raw resolved trackers. Any unresolved portal →
 * overall UNKNOWN; never a partial exact fraction.
 */
export function deriveWarbandPortalsGoal(
  perPortalCharacterSignals: SeasonGoalSignal[][]
): SeasonGoalSignal {
  const presentation = seasonGoalPresentation("portals");
  const total = perPortalCharacterSignals.length || 8;
  const aggregated = perPortalCharacterSignals.map((signals) =>
    deriveWarbandBooleanGoal(signals, "portals")
  );
  const knownCompletedCount = aggregated.filter(
    (signal) => signal.state === "COMPLETE"
  ).length;
  const knownEvidenceCount = aggregated.filter(
    (signal) => signal.state !== "UNKNOWN"
  ).length;

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
