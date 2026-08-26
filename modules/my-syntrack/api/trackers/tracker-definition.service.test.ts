import { describe, expect, it } from "vitest";
import { FakeTrackerDefinitionRepository } from "./tracker.fakes.js";
import { TrackerDefinitionService } from "./tracker-definition.service.js";

function createService() {
  return new TrackerDefinitionService(
    new FakeTrackerDefinitionRepository()
  );
}

describe("TrackerDefinitionService - identity", () => {
  it("allows the same tracker key to exist in two different scopes", async () => {
    const service = createService();

    await service.create({
      scopeKey: "MIDNIGHT-S1",
      key: "world-tour",
      name: "World Tour",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY"
    });

    const secondScope =
      await service.create({
        scopeKey: "MIDNIGHT-S2",
        key: "world-tour",
        name: "World Tour",
        valueType: "BOOLEAN",
        resetBehavior: "WEEKLY"
      });

    expect(
      secondScope.scopeKey
    ).toBe("MIDNIGHT-S2");
    expect(secondScope.key).toBe(
      "world-tour"
    );
  });

  it("rejects a duplicate key inside the same scope", async () => {
    const service = createService();

    await service.create({
      scopeKey: "MIDNIGHT-S1",
      key: "world-tour",
      name: "World Tour",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY"
    });

    await expect(
      service.create({
        scopeKey: "MIDNIGHT-S1",
        key: "world-tour",
        name: "World Tour (again)",
        valueType: "TEXT",
        resetBehavior: "SEASONAL"
      })
    ).rejects.toThrow();
  });

  it("normalizes scopeKey and key once, deterministically, before checking identity", async () => {
    const service = createService();

    await service.create({
      scopeKey: "midnight s1",
      key: "World Tour",
      name: "World Tour",
      valueType: "BOOLEAN",
      resetBehavior: "WEEKLY"
    });

    await expect(
      service.create({
        scopeKey: "Midnight S1",
        key: "world-tour",
        name: "World Tour duplicate",
        valueType: "BOOLEAN",
        resetBehavior: "WEEKLY"
      })
    ).rejects.toThrow();
  });
});

describe("TrackerDefinitionService - metadata updates", () => {
  it("updates safe metadata (name/category/sortOrder/isPinned/enabled) without touching identity", async () => {
    const service = createService();

    const created = await service.create(
      {
        scopeKey: "MIDNIGHT-S1",
        key: "delve-quest",
        name: "Delve Quest",
        valueType: "BOOLEAN",
        resetBehavior: "WEEKLY"
      }
    );

    const updated =
      await service.updateMetadata(
        created.id,
        {
          name: "Delve Quest (renamed)",
          isPinned: false,
          enabled: false
        }
      );

    expect(updated.name).toBe(
      "Delve Quest (renamed)"
    );
    expect(updated.isPinned).toBe(
      false
    );
    expect(updated.enabled).toBe(
      false
    );
    expect(updated.scopeKey).toBe(
      "MIDNIGHT-S1"
    );
    expect(updated.key).toBe(
      "delve-quest"
    );
    expect(updated.valueType).toBe(
      "BOOLEAN"
    );
  });

  it("a disabled definition remains fully readable via listByScope", async () => {
    const service = createService();

    const created = await service.create(
      {
        scopeKey: "MIDNIGHT-S1",
        key: "cracked",
        name: "Cracked",
        valueType: "BOOLEAN",
        resetBehavior: "WEEKLY"
      }
    );

    await service.updateMetadata(
      created.id,
      { enabled: false }
    );

    const listed =
      await service.listByScope(
        "MIDNIGHT-S1"
      );

    expect(
      listed.some(
        (definition) =>
          definition.id === created.id
      )
    ).toBe(true);
  });
});
