import type { ResolvedTrackerDefinition } from "../weekly-checklist/weeklies-gameplay-signals.mapper.js";
import { SEASON_EVIDENCE_CATALOG } from "./season-evidence-catalog.js";
import type { SeasonGoalSignal } from "./season-checklist.types.js";

function goalSignal(
  key: string,
  title: string,
  state: SeasonGoalSignal["state"],
  label: string,
  actionLabel: string | null
): SeasonGoalSignal {
  return {
    key,
    title,
    state,
    label,
    detail: title,
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

export function deriveBooleanEvidenceGoal(
  resolved: ResolvedTrackerDefinition | null
): SeasonGoalSignal {
  const catalogEvidence = resolved
    ? SEASON_EVIDENCE_CATALOG.find(
        (entry) => entry.trackerKey === resolved.definition.key
      )
    : undefined;
  const key = catalogEvidence?.goalKey ?? resolved?.definition.key ?? "evidence";
  const title = resolved?.definition.name ?? "Season evidence";
  const completed = booleanValue(resolved);

  if (completed === null) {
    return goalSignal(key, title, "UNKNOWN", "?", null);
  }

  return completed
    ? goalSignal(key, title, "COMPLETE", "✓", null)
    : goalSignal(
        key,
        title,
        "INCOMPLETE",
        "open",
        `Complete ${title}`
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
  const { knownCompletedCount, knownEvidenceCount, total } =
    countPortalEvidence(resolved);

  if (knownEvidenceCount < total) {
    return goalSignal("portals", "Dungeon portals", "UNKNOWN", "?", null);
  }

  if (knownCompletedCount === total) {
    return goalSignal(
      "portals",
      "Dungeon portals",
      "COMPLETE",
      `✓ ${total}/${total}`,
      null
    );
  }

  return goalSignal(
    "portals",
    "Dungeon portals",
    "INCOMPLETE",
    `${knownCompletedCount}/${total}`,
    "Earn remaining dungeon portals"
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

  if (ceValue === true) {
    return goalSignal("raid", "Ula'tek raid", "COMPLETE", "✓ CE", null);
  }

  if (aotcValue === true) {
    return goalSignal("raid", "Ula'tek raid", "COMPLETE", "✓ AOTC", null);
  }

  if (aotcValue === false) {
    return goalSignal(
      "raid",
      "Ula'tek raid",
      "INCOMPLETE",
      "AOTC open",
      "Earn Ahead of the Curve: Ula'tek"
    );
  }

  return goalSignal("raid", "Ula'tek raid", "UNKNOWN", "?", null);
}

export function deriveWarbandBooleanGoal(
  signals: SeasonGoalSignal[],
  key: string,
  title: string,
  incompleteAction: string
): SeasonGoalSignal {
  const hasComplete = signals.some((signal) => signal.state === "COMPLETE");
  const knownIncomplete = signals.filter(
    (signal) => signal.state === "INCOMPLETE"
  );
  const allUnknown =
    signals.length === 0 ||
    signals.every((signal) => signal.state === "UNKNOWN");

  if (hasComplete) {
    return goalSignal(key, title, "COMPLETE", "✓", null);
  }

  if (allUnknown) {
    return goalSignal(key, title, "UNKNOWN", "?", null);
  }

  if (knownIncomplete.length > 0) {
    return goalSignal(
      key,
      title,
      "INCOMPLETE",
      "open",
      incompleteAction
    );
  }

  return goalSignal(key, title, "UNKNOWN", "?", null);
}

export const deriveCatalystGoal = deriveBooleanEvidenceGoal;
export const deriveCrackedGoal = deriveBooleanEvidenceGoal;
export const deriveNemesisGoal = deriveBooleanEvidenceGoal;
