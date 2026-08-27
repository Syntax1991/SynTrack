import { describe, expect, it } from "vitest";
import { GLOBAL_TRACKER_SCOPE_KEY } from "../trackers/global-tracker-scope.js";
import {
  FakeActiveScopeLookup,
  FakeResourceDefinitionRepository
} from "./resource-definition.fakes.js";
import { ResourceDefinitionService } from "./resource-definition.service.js";

function buildService(activeKey: string | null) {
  const repository = new FakeResourceDefinitionRepository();

  repository.seed({
    key: "hero-dawncrest",
    scopeKey: "MIDNIGHT-S1",
    externalCurrencyId: 3345,
    name: "Hero Dawncrest",
    category: "UPGRADE",
    ownershipScope: "CHARACTER"
  });

  repository.seed({
    key: "hero-dawncrest-old-season",
    scopeKey: "MIDNIGHT-S0",
    externalCurrencyId: 9999,
    name: "Old Season Crest",
    category: "UPGRADE",
    ownershipScope: "CHARACTER"
  });

  repository.seed({
    key: "disabled-resource",
    scopeKey: "MIDNIGHT-S1",
    externalCurrencyId: 1234,
    name: "Disabled Resource",
    category: "OTHER",
    ownershipScope: "CHARACTER",
    enabled: false
  });

  repository.seed({
    key: "global-goal",
    scopeKey: GLOBAL_TRACKER_SCOPE_KEY,
    externalCurrencyId: 4321,
    name: "Global Goal",
    category: "OTHER",
    ownershipScope: "CHARACTER"
  });

  const service = new ResourceDefinitionService(
    repository,
    new FakeActiveScopeLookup(activeKey)
  );

  return { service, repository };
}

describe("ResourceDefinitionService", () => {
  it("returns the active season's enabled definitions plus GLOBAL", async () => {
    const { service } = buildService("MIDNIGHT-S1");

    const definitions =
      await service.listEnabledForActiveSeason();

    expect(
      definitions.map((definition) => definition.key).sort()
    ).toEqual(["global-goal", "hero-dawncrest"]);
  });

  it("excludes a disabled definition even when it belongs to the active season", async () => {
    const { service } = buildService("MIDNIGHT-S1");

    const definitions =
      await service.listEnabledForActiveSeason();

    expect(
      definitions.some(
        (definition) => definition.key === "disabled-resource"
      )
    ).toBe(false);
  });

  it("excludes a definition from an inactive season", async () => {
    const { service } = buildService("MIDNIGHT-S1");

    const definitions =
      await service.listEnabledForActiveSeason();

    expect(
      definitions.some(
        (definition) =>
          definition.key === "hero-dawncrest-old-season"
      )
    ).toBe(false);
  });

  it("still returns GLOBAL definitions when no season is active", async () => {
    const { service } = buildService(null);

    const definitions =
      await service.listEnabledForActiveSeason();

    expect(
      definitions.map((definition) => definition.key)
    ).toEqual(["global-goal"]);
  });

  it("rejects a seed with neither an external currency id nor an item id", async () => {
    const { service } = buildService("MIDNIGHT-S1");

    await expect(
      service.ensureDefinition({
        key: "no-external-id",
        scopeKey: "MIDNIGHT-S1",
        name: "Invalid",
        category: "OTHER",
        resetBehavior: "WEEKLY",
        ownershipScope: "UNKNOWN"
      })
    ).rejects.toThrow(/needs an externalCurrencyId or an externalItemId/);
  });

  it("accepts a seed backed only by an external item id", async () => {
    const { service } = buildService("MIDNIGHT-S1");

    const created = await service.ensureDefinition({
      key: "spark-of-tides",
      scopeKey: "MIDNIGHT-S1",
      externalItemId: 274476,
      name: "Spark of Tides",
      category: "CRAFTING_GATE",
      resetBehavior: "WEEKLY",
      ownershipScope: "CHARACTER"
    });

    expect(created.externalItemId).toBe(274476);
    expect(created.externalCurrencyId).toBeNull();
  });

  it("upserting the same key twice updates rather than duplicates", async () => {
    const { service, repository } = buildService(
      "MIDNIGHT-S1"
    );

    await service.ensureDefinition({
      key: "spark-of-tides",
      scopeKey: "MIDNIGHT-S1",
      externalItemId: 274476,
      name: "Spark of Tides",
      category: "CRAFTING_GATE",
      resetBehavior: "WEEKLY",
      ownershipScope: "CHARACTER"
    });

    await service.ensureDefinition({
      key: "spark-of-tides",
      scopeKey: "MIDNIGHT-S1",
      externalItemId: 274476,
      name: "Spark of Tides (renamed)",
      category: "CRAFTING_GATE",
      resetBehavior: "WEEKLY",
      ownershipScope: "CHARACTER"
    });

    const row = await repository.findByKey(
      "spark-of-tides"
    );

    expect(row?.name).toBe("Spark of Tides (renamed)");
  });
});
