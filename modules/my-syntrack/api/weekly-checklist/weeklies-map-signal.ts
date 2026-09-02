import type { WeeklyGameplayDomainView } from "../weekly-gameplay/weekly-gameplay.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import {
  WEEKLIES_MAP_DELVE_REQUIREMENT,
  WEEKLIES_MAP_MEANING
} from "./weeklies-tracker-keys.js";
import type {
  WeekliesGameplaySignal,
  WeekliesGameplaySignalSource
} from "./weeklies-gameplay-signals.types.js";

type ResolvedBountyTracker = {
  definition: TrackerDefinitionRow;
  state: CharacterTrackerState | null;
};

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

function readBountyUsed(
  bounty: ResolvedBountyTracker | null
): "UNKNOWN" | "USED" | "NOT_USED" {
  if (!bounty) {
    return "UNKNOWN";
  }

  if (
    !bounty.state ||
    bounty.state.state === "UNKNOWN" ||
    !bounty.state.value
  ) {
    return "UNKNOWN";
  }

  if (bounty.state.value.valueType !== "BOOLEAN") {
    return "UNKNOWN";
  }

  return bounty.state.value.boolean ? "USED" : "NOT_USED";
}

function readDelveCount(
  delves: WeeklyGameplayDomainView | null
): number | null {
  if (!delves || delves.state === "UNKNOWN") {
    return null;
  }

  return delves.rawCompleteCount;
}

export function deriveMapSignal(
  bounty: ResolvedBountyTracker | null,
  delves: WeeklyGameplayDomainView | null
): WeekliesGameplaySignal {
  const title = WEEKLIES_MAP_MEANING;
  const bountyUsed = readBountyUsed(bounty);
  const delveCount = readDelveCount(delves);

  if (!bounty) {
    return unknownSignal(
      `${title} — Trove Hunter's Bounty tracker not configured`
    );
  }

  if (bountyUsed === "UNKNOWN" || delveCount === null) {
    const unresolved: string[] = [];

    if (bountyUsed === "UNKNOWN") {
      unresolved.push("Trove Hunter's Bounty");
    }

    if (delveCount === null) {
      unresolved.push("Delve count");
    }

    return unknownSignal(
      `${title} — ${unresolved.join(" and ")} unresolved`
    );
  }

  const delvesComplete =
    delveCount >= WEEKLIES_MAP_DELVE_REQUIREMENT;

  if (bountyUsed === "USED" && delvesComplete) {
    return completeSignal(title);
  }

  if (bountyUsed === "NOT_USED" && !delvesComplete) {
    return incompleteSignal(
      "open",
      title,
      `Use Trove Hunter's Bounty and complete ${WEEKLIES_MAP_DELVE_REQUIREMENT} Delves`
    );
  }

  if (bountyUsed === "NOT_USED") {
    return incompleteSignal(
      "open",
      `${title} — bounty not used`,
      "Use Trove Hunter's Bounty"
    );
  }

  const remaining =
    WEEKLIES_MAP_DELVE_REQUIREMENT - delveCount;

  return incompleteSignal(
    `${delveCount}/${WEEKLIES_MAP_DELVE_REQUIREMENT}`,
    `${title} — ${delveCount} of ${WEEKLIES_MAP_DELVE_REQUIREMENT} Delves`,
    `${remaining} more Delve${remaining === 1 ? "" : "s"} for MAP`
  );
}

export function deriveMapSignalSource(
  bounty: ResolvedBountyTracker | null
): WeekliesGameplaySignalSource {
  if (!bounty) {
    return {
      configured: false,
      trackerName: null,
      resetBehavior: null
    };
  }

  return {
    configured: true,
    trackerName: bounty.definition.name,
    resetBehavior: bounty.definition.resetBehavior
  };
}
