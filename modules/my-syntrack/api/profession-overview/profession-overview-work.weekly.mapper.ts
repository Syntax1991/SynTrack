import type { ProfessionWeeklySourceStatus } from "../profession-weekly/profession-weekly-status.types.js";
import type {
  ProfessionOverviewWorkSource,
  ProfessionWorkSourceState,
  ProfessionWorkWeeklyState
} from "./profession-overview-work.types.js";

export function sourceState(
  source: ProfessionWeeklySourceStatus | null | undefined
): ProfessionWorkSourceState {
  if (!source) {
    return "NOT_APPLICABLE";
  }

  return source.state;
}

function dropsLabel(
  source: ProfessionWeeklySourceStatus | null | undefined
): string | null {
  if (
    !source ||
    source.currentValue === null ||
    source.maxValue === null
  ) {
    return null;
  }

  return `${source.currentValue}/${source.maxValue}`;
}

export function mapWeeklySource(
  source: ProfessionWeeklySourceStatus | null | undefined
): ProfessionOverviewWorkSource {
  const state = sourceState(source);

  if (state === "NOT_APPLICABLE") {
    return {
      state,
      label: "—",
      source: null
    };
  }

  if (state === "COMPLETE") {
    return {
      state,
      label: "✓",
      source: source ?? null
    };
  }

  if (state === "UNKNOWN") {
    return {
      state,
      label: "?",
      source: source ?? null
    };
  }

  if (source?.sourceType === "KNOWLEDGE_DROPS") {
    return {
      state,
      label: dropsLabel(source) ?? "!",
      source
    };
  }

  return {
    state,
    label: "!",
    source: source ?? null
  };
}

export function resolveProfessionWeeklyRowState(input: {
  quest: ProfessionOverviewWorkSource;
  treatise: ProfessionOverviewWorkSource;
  drops: ProfessionOverviewWorkSource;
}): ProfessionWorkWeeklyState {
  const applicable = [
    input.quest,
    input.treatise,
    input.drops
  ].filter((source) => source.state !== "NOT_APPLICABLE");

  if (applicable.length === 0) {
    return "NOT_APPLICABLE";
  }

  if (applicable.some((source) => source.state === "INCOMPLETE")) {
    return "ATTENTION";
  }

  if (applicable.some((source) => source.state === "UNKNOWN")) {
    return "UNKNOWN";
  }

  return "COMPLETE";
}

export function resolveProfessionWeeklySummary(input: {
  quest: ProfessionOverviewWorkSource;
  treatise: ProfessionOverviewWorkSource;
  drops: ProfessionOverviewWorkSource;
  state: ProfessionWorkWeeklyState;
}): string {
  if (input.state === "NOT_APPLICABLE") {
    return "—";
  }

  if (input.state === "COMPLETE") {
    return "✓";
  }

  if (input.state === "UNKNOWN") {
    return "?";
  }

  const openLabels: string[] = [];

  if (input.quest.state === "INCOMPLETE") {
    openLabels.push("Quest");
  }

  if (input.treatise.state === "INCOMPLETE") {
    openLabels.push("Treatise");
  }

  if (input.drops.state === "INCOMPLETE") {
    openLabels.push("Drop");
  }

  if (openLabels.length === 1) {
    return openLabels[0]!;
  }

  if (openLabels.length === 2) {
    return `${openLabels[0]} + ${openLabels[1]}`;
  }

  return `${openLabels.length} open`;
}
