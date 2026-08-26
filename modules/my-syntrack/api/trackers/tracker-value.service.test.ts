import { describe, expect, it } from "vitest";
import {
  FakeTrackerDefinitionRepository,
  FakeTrackerValueRepository
} from "./tracker.fakes.js";
import { TrackerValueService } from "./tracker-value.service.js";

async function createHarness() {
  const definitionRepository =
    new FakeTrackerDefinitionRepository();

  const valueRepository =
    new FakeTrackerValueRepository();

  const service = new TrackerValueService(
    valueRepository,
    definitionRepository
  );

  const booleanDefinition =
    await definitionRepository.create({
      scopeKey: "MIDNIGHT-S1",
      key: "world-tour",
      name: "World Tour",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY"
    });

  return {
    service,
    definitionRepository,
    booleanDefinition
  };
}

describe("TrackerValueService - UNKNOWN vs recorded", () => {
  it("no value row means UNKNOWN, never a false/zero/empty default", async () => {
    const { service, booleanDefinition } =
      await createHarness();

    const state = (
      await service.getStatesForScope(
        "MIDNIGHT-S1",
        ["char-1"]
      )
    ).find(
      (entry) =>
        entry.trackerDefinitionId ===
          booleanDefinition.id &&
        entry.characterId === "char-1"
    );

    expect(state?.state).toBe(
      "UNKNOWN"
    );
    expect(state?.value).toBeNull();
  });

  it("recording an explicit false is RECORDED, not UNKNOWN", async () => {
    const { service, booleanDefinition } =
      await createHarness();

    await service.setValue(
      booleanDefinition.id,
      "char-1",
      { valueType: "BOOLEAN", boolean: false }
    );

    const state = (
      await service.getStatesForScope(
        "MIDNIGHT-S1",
        ["char-1"]
      )
    ).find(
      (entry) =>
        entry.trackerDefinitionId ===
        booleanDefinition.id
    );

    expect(state?.state).toBe(
      "RECORDED"
    );
    expect(state?.value).toEqual({
      valueType: "BOOLEAN",
      boolean: false
    });
  });
});

describe("TrackerValueService - clear", () => {
  it("clearing a recorded value deletes the row and returns to UNKNOWN", async () => {
    const { service, booleanDefinition } =
      await createHarness();

    await service.setValue(
      booleanDefinition.id,
      "char-1",
      { valueType: "BOOLEAN", boolean: true }
    );

    const cleared =
      await service.clearValue(
        booleanDefinition.id,
        "char-1"
      );

    expect(cleared.state).toBe(
      "UNKNOWN"
    );
    expect(cleared.value).toBeNull();
  });
});

describe("TrackerValueService - disabled definitions", () => {
  it("rejects a new value write on a disabled definition", async () => {
    const {
      service,
      definitionRepository,
      booleanDefinition
    } = await createHarness();

    await definitionRepository.updateMetadata(
      booleanDefinition.id,
      { enabled: false }
    );

    await expect(
      service.setValue(
        booleanDefinition.id,
        "char-1",
        {
          valueType: "BOOLEAN",
          boolean: true
        }
      )
    ).rejects.toThrow();
  });

  it("still allows clearing an existing value on a disabled definition", async () => {
    const {
      service,
      definitionRepository,
      booleanDefinition
    } = await createHarness();

    await service.setValue(
      booleanDefinition.id,
      "char-1",
      { valueType: "BOOLEAN", boolean: true }
    );

    await definitionRepository.updateMetadata(
      booleanDefinition.id,
      { enabled: false }
    );

    const cleared =
      await service.clearValue(
        booleanDefinition.id,
        "char-1"
      );

    expect(cleared.state).toBe(
      "UNKNOWN"
    );
  });
});
