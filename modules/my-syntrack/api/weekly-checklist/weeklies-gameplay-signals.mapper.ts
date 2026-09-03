import type { WeeklyGameplayDomainView } from "../weekly-gameplay/weekly-gameplay.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import {
  WEEKLIES_META_QUEST_TRACKER_KEY,
  WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY
} from "./weeklies-tracker-keys.js";
import {
  deriveMapSignal,
  deriveMapSignalSource
} from "./weeklies-map-signal.js";
import type {
  WeekliesGameplaySignal,
  WeekliesGameplaySignals,
  WeekliesGameplaySignalSource,
  WeekliesSignalState
} from "./weeklies-gameplay-signals.types.js";

const TWO_K_RIO_MILESTONE = 2000;

const TWO_K_RIO_TITLE =
  "Current-season Mythic+ rating / 2,000 milestone";

const META_SOURCE_NOT_CONFIGURED_TITLE =
  "Meta Quest tracker not configured";

export type ResolvedTrackerDefinition = {
  definition: TrackerDefinitionRow;
  state: CharacterTrackerState | null;
};

function unconfiguredSource(): WeekliesGameplaySignalSource {
  return {
    configured: false,
    trackerName: null,
    resetBehavior: null
  };
}

function configuredSource(
  definition: TrackerDefinitionRow
): WeekliesGameplaySignalSource {
  return {
    configured: true,
    trackerName: definition.name,
    resetBehavior: definition.resetBehavior
  };
}

function unknownSignal(title: string): WeekliesGameplaySignal {
  return {
    state: "UNKNOWN",
    label: "?",
    title,
    actionLabel: null
  };
}

function completeSignal(title: string): WeekliesGameplaySignal {
  return {
    state: "COMPLETE",
    label: "✓",
    title,
    actionLabel: null
  };
}

function incompleteSignal(
  label: string,
  title: string,
  actionLabel: string | null = null
): WeekliesGameplaySignal {
  return {
    state: "INCOMPLETE",
    label,
    title,
    actionLabel
  };
}

export function deriveTwoKRioSignal(
  resolved: ResolvedTrackerDefinition | null
): WeekliesGameplaySignal {
  if (!resolved) {
    return unknownSignal(
      `${TWO_K_RIO_TITLE} — no canonical rating tracker configured`
    );
  }

  const { definition, state } = resolved;
  const title = definition.name
    ? `${TWO_K_RIO_TITLE} (${definition.name})`
    : TWO_K_RIO_TITLE;

  if (!state || state.state === "UNKNOWN" || !state.value) {
    return unknownSignal(title);
  }

  if (state.value.valueType !== "NUMBER") {
    return unknownSignal(
      `${title} — expected NUMBER tracker value`
    );
  }

  const score = state.value.number;

  if (score >= TWO_K_RIO_MILESTONE) {
    return completeSignal(title);
  }

  return incompleteSignal(String(score), title);
}

export function deriveMetaQuestSignal(
  resolved: ResolvedTrackerDefinition | null
): WeekliesGameplaySignal {
  if (!resolved) {
    return unknownSignal(META_SOURCE_NOT_CONFIGURED_TITLE);
  }

  const { definition, state } = resolved;
  const title = definition.name;

  if (!state || state.state === "UNKNOWN" || !state.value) {
    return unknownSignal(title);
  }

  if (state.value.valueType === "BOOLEAN") {
    if (state.value.boolean) {
      return completeSignal(title);
    }

    return incompleteSignal("open", title, "Complete Meta Quest");
  }

  if (state.value.valueType === "PROGRESS") {
    const { current, total } = state.value;

    if (current >= total) {
      return completeSignal(title);
    }

    return incompleteSignal(
      `${current}/${total}`,
      `${title} — ${current} of ${total}`,
      "Complete Meta Quest"
    );
  }

  return unknownSignal(`${title} — unsupported tracker value type`);
}

export function resolveWeekliesGameplaySignals(input: {
  bounty: ResolvedTrackerDefinition | null;
  meta: ResolvedTrackerDefinition | null;
  delves: WeeklyGameplayDomainView | null;
}): WeekliesGameplaySignals {
  return {
    map: deriveMapSignal(input.bounty, input.delves),
    meta: deriveMetaQuestSignal(input.meta),
    sources: {
      map: deriveMapSignalSource(input.bounty),
      meta: input.meta
        ? configuredSource(input.meta.definition)
        : unconfiguredSource()
    }
  };
}

export function createDefaultWeekliesGameplaySignals(): WeekliesGameplaySignals {
  return resolveWeekliesGameplaySignals({
    bounty: null,
    meta: null,
    delves: null
  });
}

export function weekliesSignalTone(
  state: WeekliesSignalState
): "ready" | "attention" | "unknown" | "not-tracked" {
  if (state === "COMPLETE") {
    return "ready";
  }

  if (state === "INCOMPLETE") {
    return "attention";
  }

  if (state === "NOT_APPLICABLE") {
    return "not-tracked";
  }

  return "unknown";
}

export function resolveDefinitionByKey(
  definitionsByScope: Map<string, TrackerDefinitionRow[]>,
  scopeKeys: string[],
  trackerKey: string
): TrackerDefinitionRow | null {
  for (const scopeKey of scopeKeys) {
    const definitions = definitionsByScope.get(scopeKey) ?? [];

    const match = definitions.find(
      (definition) =>
        definition.key === trackerKey && definition.enabled
    );

    if (match) {
      return match;
    }
  }

  return null;
}

export function buildResolvedTracker(
  definition: TrackerDefinitionRow | null,
  statesByDefinitionId: Map<string, CharacterTrackerState>
): ResolvedTrackerDefinition | null {
  if (!definition) {
    return null;
  }

  return {
    definition,
    state: statesByDefinitionId.get(definition.id) ?? null
  };
}

export const WEEKLIES_SIGNAL_DEFINITION_KEYS = {
  bounty: WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY,
  meta: WEEKLIES_META_QUEST_TRACKER_KEY
} as const;
