import { describe, expect, it } from "vitest";
import type { WeeklyGameplayDomainView } from "../weekly-gameplay/weekly-gameplay.types.js";
import type { TrackerDefinitionRow } from "../trackers/tracker-repository.types.js";
import { deriveMapSignal } from "./weeklies-map-signal.js";

function definition(
  overrides: Partial<TrackerDefinitionRow> &
    Pick<TrackerDefinitionRow, "key" | "name">
): TrackerDefinitionRow {
  return {
    id: "bounty-def",
    scopeKey: "SEASON-MIDNIGHT",
    valueType: "BOOLEAN",
    resetBehavior: "WEEKLY",
    category: "GAMEPLAY",
    sortOrder: 15,
    isPinned: false,
    enabled: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides
  };
}

function delves(
  overrides: Partial<WeeklyGameplayDomainView>
): WeeklyGameplayDomainView {
  return {
    state: "ATTENTION",
    completeCount: 0,
    applicableTotal: 8,
    unknownCount: 0,
    label: "Delves",
    rawCompleteCount: 0,
    knownUnlockedSlots: 0,
    maxSlots: 3,
    hasUnknownCategories: false,
    unknownCategoryCount: 0,
    ...overrides
  };
}

describe("deriveMapSignal", () => {
  const bountyDefinition = definition({
    key: "trove-hunters-bounty-used",
    name: "Trove Hunter's Bounty used"
  });

  it("shows complete when bounty is used and at least 8 delves are known", () => {
    const signal = deriveMapSignal(
      {
        definition: bountyDefinition,
        state: {
          trackerDefinitionId: "bounty-def",
          characterId: "char-1",
          periodKey: "2026-08-26",
          state: "RECORDED",
          source: "MANUAL",
          value: {
            valueType: "BOOLEAN",
            boolean: true
          }
        }
      },
      delves({
        state: "READY",
        rawCompleteCount: 8,
        completeCount: 8
      })
    );

    expect(signal.state).toBe("COMPLETE");
    expect(signal.label).toBe("✓");
  });

  it("shows delve progress when bounty is used but fewer than 8 delves", () => {
    const signal = deriveMapSignal(
      {
        definition: bountyDefinition,
        state: {
          trackerDefinitionId: "bounty-def",
          characterId: "char-1",
          periodKey: "2026-08-26",
          state: "RECORDED",
          source: "MANUAL",
          value: {
            valueType: "BOOLEAN",
            boolean: true
          }
        }
      },
      delves({
        state: "ATTENTION",
        rawCompleteCount: 6,
        completeCount: 6
      })
    );

    expect(signal.state).toBe("INCOMPLETE");
    expect(signal.label).toBe("6/8");
    expect(signal.actionLabel).toBe("2 more Delves for MAP");
  });

  it("shows open when bounty is unused even with enough delves", () => {
    const signal = deriveMapSignal(
      {
        definition: bountyDefinition,
        state: {
          trackerDefinitionId: "bounty-def",
          characterId: "char-1",
          periodKey: "2026-08-26",
          state: "RECORDED",
          source: "MANUAL",
          value: {
            valueType: "BOOLEAN",
            boolean: false
          }
        }
      },
      delves({
        state: "READY",
        rawCompleteCount: 10,
        completeCount: 8
      })
    );

    expect(signal.state).toBe("INCOMPLETE");
    expect(signal.label).toBe("open");
    expect(signal.actionLabel).toBe("Use Trove Hunter's Bounty");
  });

  it("shows unknown when delve evidence is unresolved", () => {
    const signal = deriveMapSignal(
      {
        definition: bountyDefinition,
        state: {
          trackerDefinitionId: "bounty-def",
          characterId: "char-1",
          periodKey: "2026-08-26",
          state: "RECORDED",
          source: "MANUAL",
          value: {
            valueType: "BOOLEAN",
            boolean: true
          }
        }
      },
      delves({ state: "UNKNOWN" })
    );

    expect(signal.state).toBe("UNKNOWN");
    expect(signal.label).toBe("?");
  });

  it("shows unknown when bounty tracker is not configured", () => {
    const signal = deriveMapSignal(
      null,
      delves({
        state: "READY",
        rawCompleteCount: 8,
        completeCount: 8
      })
    );

    expect(signal.state).toBe("UNKNOWN");
    expect(signal.label).toBe("?");
  });
});
