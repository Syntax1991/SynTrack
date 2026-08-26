import { describe, expect, it } from "vitest";
import {
  FakeTrackerDefinitionRepository,
  FakeTrackerValueRepository
} from "./tracker.fakes.js";
import { NON_WEEKLY_TRACKER_PERIOD_KEY } from "./tracker-period.js";
import { TrackerValueService } from "./tracker-value.service.js";

describe("TrackerValueService - WEEKLY history", () => {
  it("a previous week's row survives untouched, and the next week starts UNKNOWN until written", async () => {
    const definitionRepository =
      new FakeTrackerDefinitionRepository();

    const valueRepository =
      new FakeTrackerValueRepository();

    const service = new TrackerValueService(
      valueRepository,
      definitionRepository
    );

    const definition =
      await definitionRepository.create({
        scopeKey: "MIDNIGHT-S1",
        key: "world-tour",
        name: "World Tour",
        valueType: "BOOLEAN",
        resetBehavior: "WEEKLY"
      });

    // Simulate a prior week's already-recorded row directly (bypassing
    // the write service, the same way a real past week's row would
    // simply already exist in the database).
    valueRepository.seed({
      trackerDefinitionId:
        definition.id,
      characterId: "char-1",
      periodKey: "2026-08-19",
      booleanValue: true,
      progressCurrent: null,
      progressTotal: null,
      numberValue: null,
      textValue: null,
      source: "MANUAL"
    });

    const currentStates =
      await service.getStatesForScope(
        "MIDNIGHT-S1",
        ["char-1"]
      );

    const currentState =
      currentStates.find(
        (entry) =>
          entry.trackerDefinitionId ===
          definition.id
      );

    // The current (real) week has no row yet - UNKNOWN, not bleeding
    // in the prior week's true value.
    expect(currentState?.state).toBe(
      "UNKNOWN"
    );
    expect(
      currentState?.periodKey
    ).not.toBe("2026-08-19");

    // The old row itself is untouched.
    const oldRow =
      await valueRepository.findOne(
        definition.id,
        "char-1",
        "2026-08-19"
      );

    expect(
      oldRow?.booleanValue
    ).toBe(true);

    // Writing now creates/upserts the NEW current period, leaving the
    // old row alone.
    await service.setValue(
      definition.id,
      "char-1",
      { valueType: "BOOLEAN", boolean: true }
    );

    const oldRowAfterWrite =
      await valueRepository.findOne(
        definition.id,
        "char-1",
        "2026-08-19"
      );

    expect(
      oldRowAfterWrite?.booleanValue
    ).toBe(true);
  });
});

describe("TrackerValueService - SEASONAL/PERMANENT never use WEEKLY period keys", () => {
  it("a SEASONAL definition's value always resolves to the shared non-weekly sentinel, never getWeeklyPeriod's key", async () => {
    const definitionRepository =
      new FakeTrackerDefinitionRepository();

    const valueRepository =
      new FakeTrackerValueRepository();

    const service = new TrackerValueService(
      valueRepository,
      definitionRepository
    );

    const definition =
      await definitionRepository.create({
        scopeKey: "MIDNIGHT-S1",
        key: "ce",
        name: "CE",
        valueType: "TEXT",
        resetBehavior: "SEASONAL"
      });

    const state = await service.setValue(
      definition.id,
      "char-1",
      {
        valueType: "TEXT",
        text: "Dimensius"
      }
    );

    expect(state.periodKey).toBe(
      NON_WEEKLY_TRACKER_PERIOD_KEY
    );
  });
});

describe("TrackerValueService - cross-character isolation", () => {
  it("one character's value never appears in another character's state", async () => {
    const definitionRepository =
      new FakeTrackerDefinitionRepository();

    const valueRepository =
      new FakeTrackerValueRepository();

    const service = new TrackerValueService(
      valueRepository,
      definitionRepository
    );

    const definition =
      await definitionRepository.create({
        scopeKey: "MIDNIGHT-S1",
        key: "world-tour",
        name: "World Tour",
        valueType: "BOOLEAN",
        resetBehavior: "WEEKLY"
      });

    await service.setValue(
      definition.id,
      "char-1",
      { valueType: "BOOLEAN", boolean: true }
    );

    const states =
      await service.getStatesForScope(
        "MIDNIGHT-S1",
        ["char-1", "char-2"]
      );

    const char1State = states.find(
      (entry) =>
        entry.characterId === "char-1"
    );

    const char2State = states.find(
      (entry) =>
        entry.characterId === "char-2"
    );

    expect(
      char1State?.state
    ).toBe("RECORDED");
    expect(
      char2State?.state
    ).toBe("UNKNOWN");
  });
});
