import { describe, expect, it } from "vitest";
import type { CharacterTrackerState } from "../trackers/tracker.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import {
  deriveMetaQuestSignal,
  deriveTwoKRioSignal,
  resolveWeekliesGameplaySignals
} from "./weeklies-gameplay-signals.mapper.js";

function definition(
  overrides: Partial<TrackerDefinitionRow> &
    Pick<
      TrackerDefinitionRow,
      "key" | "name" | "valueType" | "resetBehavior"
    >
): TrackerDefinitionRow {
  return {
    id: overrides.id ?? "def-1",
    scopeKey: overrides.scopeKey ?? "SEASON-TEST",
    category: overrides.category ?? null,
    sortOrder: overrides.sortOrder ?? 0,
    isPinned: overrides.isPinned ?? false,
    enabled: overrides.enabled ?? true,
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-01-01T00:00:00.000Z"),
    ...overrides
  };
}

function numberState(
  number: number,
  definitionId = "def-1"
): CharacterTrackerState {
  return {
    trackerDefinitionId: definitionId,
    characterId: "char-1",
    periodKey: "2026-season",
    state: "RECORDED",
    source: "MANUAL",
    value: {
      valueType: "NUMBER",
      number
    }
  };
}

function booleanState(
  boolean: boolean,
  definitionId = "def-1"
): CharacterTrackerState {
  return {
    trackerDefinitionId: definitionId,
    characterId: "char-1",
    periodKey: "2026-08-26",
    state: "RECORDED",
    source: "MANUAL",
    value: {
      valueType: "BOOLEAN",
      boolean
    }
  };
}

describe("weeklies gameplay signals - 2K RIO", () => {
  const rioDefinition = definition({
    id: "rio-def",
    key: "mythic-plus-rating",
    name: "Mythic+ Rating",
    valueType: "NUMBER",
    resetBehavior: "SEASONAL"
  });

  it("shows complete when rating is at least 2000", () => {
    const signal = deriveTwoKRioSignal({
      definition: rioDefinition,
      state: numberState(2050, "rio-def")
    });

    expect(signal.state).toBe("COMPLETE");
    expect(signal.label).toBe("✓");
  });

  it("shows compact score when rating is below 2000", () => {
    const signal = deriveTwoKRioSignal({
      definition: rioDefinition,
      state: numberState(1874, "rio-def")
    });

    expect(signal.state).toBe("INCOMPLETE");
    expect(signal.label).toBe("1874");
    expect(signal.actionLabel).toBeNull();
  });

  it("shows unknown when no authoritative rating evidence exists", () => {
    const signal = deriveTwoKRioSignal({
      definition: rioDefinition,
      state: null
    });

    expect(signal.state).toBe("UNKNOWN");
    expect(signal.label).toBe("?");
    expect(signal.label).not.toBe("0");
  });

  it("shows unknown when tracker is not configured", () => {
    const signal = deriveTwoKRioSignal(null);

    expect(signal.state).toBe("UNKNOWN");
    expect(signal.label).toBe("?");
  });

  it("does not expose weekly action for incomplete 2K RIO", () => {
    const signal = deriveTwoKRioSignal({
      definition: rioDefinition,
      state: numberState(1530, "rio-def")
    });

    expect(signal.actionLabel).toBeNull();
  });
});

describe("weeklies gameplay signals - META", () => {
  const metaDefinition = definition({
    id: "meta-def",
    key: "meta-quest",
    name: "Weekly Meta Quest",
    valueType: "BOOLEAN",
    resetBehavior: "WEEKLY"
  });

  it("shows complete for current-period meta quest completion", () => {
    const signal = deriveMetaQuestSignal({
      definition: metaDefinition,
      state: booleanState(true, "meta-def")
    });

    expect(signal.state).toBe("COMPLETE");
    expect(signal.label).toBe("✓");
  });

  it("shows open when meta quest is proven incomplete", () => {
    const signal = deriveMetaQuestSignal({
      definition: metaDefinition,
      state: booleanState(false, "meta-def")
    });

    expect(signal.state).toBe("INCOMPLETE");
    expect(signal.label).toBe("open");
    expect(signal.actionLabel).toBe("Complete Weekly Meta Quest");
  });

  it("shows unknown without reliable current-period evidence", () => {
    const signal = deriveMetaQuestSignal({
      definition: metaDefinition,
      state: null
    });

    expect(signal.state).toBe("UNKNOWN");
    expect(signal.label).toBe("?");
  });

  it("marks source as unconfigured when tracker is missing", () => {
    const signals = resolveWeekliesGameplaySignals({
      twoKRio: null,
      bounty: null,
      meta: null,
      delves: null
    });

    expect(signals.sources.meta.configured).toBe(false);
    expect(signals.meta.label).toBe("?");
  });
});
