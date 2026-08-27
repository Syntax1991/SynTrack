import { describe, expect, it } from "vitest";
import { FakeResourceReadinessRepository } from "./resource-readiness.fakes.js";
import { ResourceReadinessService } from "./resource-readiness.service.js";
import type { ResourceDefinitionView } from "./resource-definition.types.js";

function definition(
  overrides: Partial<ResourceDefinitionView> & {
    id: string;
    key: string;
  }
): ResourceDefinitionView {
  return {
    scopeKey: "MIDNIGHT-S1",
    externalCurrencyId: 1,
    externalItemId: null,
    name: overrides.key,
    category: "OTHER",
    resetBehavior: "WEEKLY",
    ownershipScope: "CHARACTER",
    enabled: true,
    sortOrder: 0,
    ...overrides
  };
}

function lookup(definitions: ResourceDefinitionView[]) {
  return {
    listEnabledForActiveSeason: async () => definitions
  };
}

describe("ResourceReadinessService", () => {
  it("lists a CHARACTER-scoped definition as not-tracked when the character has no snapshot", async () => {
    const repository = new FakeResourceReadinessRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });

    const service = new ResourceReadinessService(
      repository,
      lookup([
        definition({
          id: "def-1",
          key: "hero-dawncrest"
        })
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.resources[0]?.snapshot).toBeNull();
    expect(character.trackedResourceCount).toBe(0);
    expect(character.totalRelevantResourceCount).toBe(1);
  });

  it("surfaces a captured CHARACTER-scoped snapshot with derived weekly status", async () => {
    const repository = new FakeResourceReadinessRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });
    repository.seedSnapshot({
      characterId: "char-1",
      resourceDefinitionId: "def-1",
      quantity: 120,
      weeklyQuantity: 40,
      maxWeeklyQuantity: 90,
      capturedAt: new Date("2026-08-27T21:12:46.000Z")
    });

    const service = new ResourceReadinessService(
      repository,
      lookup([
        definition({
          id: "def-1",
          key: "hero-dawncrest"
        })
      ])
    );

    const overview = await service.getOverview();
    const resource = overview.characters[0]!.resources[0]!;

    expect(resource.snapshot?.weeklyRemaining).toBe(50);
    expect(resource.snapshot?.weeklyComplete).toBe(false);
    expect(resource.attentionNeeded).toBe(true);
  });

  it("does not flag attention when the weekly cap is already reached", async () => {
    const repository = new FakeResourceReadinessRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });
    repository.seedSnapshot({
      characterId: "char-1",
      resourceDefinitionId: "def-1",
      weeklyQuantity: 90,
      maxWeeklyQuantity: 90,
      capturedAt: new Date()
    });

    const service = new ResourceReadinessService(
      repository,
      lookup([
        definition({
          id: "def-1",
          key: "hero-dawncrest"
        })
      ])
    );

    const overview = await service.getOverview();

    expect(
      overview.characters[0]!.resources[0]!.attentionNeeded
    ).toBe(false);
  });

  it("excludes a definition with UNKNOWN ownership scope from both character and account views", async () => {
    const repository = new FakeResourceReadinessRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });

    const service = new ResourceReadinessService(
      repository,
      lookup([
        definition({
          id: "def-1",
          key: "mystery-resource",
          ownershipScope: "UNKNOWN"
        })
      ])
    );

    const overview = await service.getOverview();

    expect(overview.characters[0]!.resources).toEqual([]);
    expect(overview.accountResources).toEqual([]);
  });

  describe("account-wide aggregation", () => {
    it("picks the single freshest snapshot when the same account-wide currency is captured by multiple characters", async () => {
      const repository = new FakeResourceReadinessRepository();
      repository.seedCharacter({ id: "char-1", name: "Synlight" });
      repository.seedCharacter({ id: "char-2", name: "Synbeast" });

      repository.seedSnapshot({
        characterId: "char-1",
        resourceDefinitionId: "def-1",
        quantity: 500,
        accountWide: true,
        capturedAt: new Date("2026-08-27T19:00:00.000Z")
      });

      repository.seedSnapshot({
        characterId: "char-2",
        resourceDefinitionId: "def-1",
        quantity: 620,
        accountWide: true,
        capturedAt: new Date("2026-08-27T21:00:00.000Z")
      });

      const service = new ResourceReadinessService(
        repository,
        lookup([
          definition({
            id: "def-1",
            key: "warband-currency",
            ownershipScope: "ACCOUNT_WIDE"
          })
        ])
      );

      const overview = await service.getOverview();
      const resource = overview.accountResources[0]!;

      expect(resource.snapshot?.quantity).toBe(620);
      expect(resource.capturedByCharacterId).toBe("char-2");
      expect(resource.ownershipMismatch).toBe(false);
    });

    it("never sums or duplicates an account-wide value across characters", async () => {
      const repository = new FakeResourceReadinessRepository();
      repository.seedCharacter({ id: "char-1", name: "Synlight" });
      repository.seedCharacter({ id: "char-2", name: "Synbeast" });

      repository.seedSnapshot({
        characterId: "char-1",
        resourceDefinitionId: "def-1",
        quantity: 500,
        accountWide: true,
        capturedAt: new Date("2026-08-27T19:00:00.000Z")
      });

      repository.seedSnapshot({
        characterId: "char-2",
        resourceDefinitionId: "def-1",
        quantity: 500,
        accountWide: true,
        capturedAt: new Date("2026-08-27T19:00:00.000Z")
      });

      const service = new ResourceReadinessService(
        repository,
        lookup([
          definition({
            id: "def-1",
            key: "warband-currency",
            ownershipScope: "ACCOUNT_WIDE"
          })
        ])
      );

      const overview = await service.getOverview();

      expect(overview.accountResources).toHaveLength(1);
      expect(overview.accountResources[0]?.snapshot?.quantity).toBe(
        500
      );
    });

    it("keeps a CHARACTER-scoped resource per-character, never pooled into accountResources", async () => {
      const repository = new FakeResourceReadinessRepository();
      repository.seedCharacter({ id: "char-1", name: "Synlight" });
      repository.seedSnapshot({
        characterId: "char-1",
        resourceDefinitionId: "def-1",
        quantity: 42,
        capturedAt: new Date()
      });

      const service = new ResourceReadinessService(
        repository,
        lookup([
          definition({
            id: "def-1",
            key: "hero-dawncrest",
            ownershipScope: "CHARACTER"
          })
        ])
      );

      const overview = await service.getOverview();

      expect(overview.accountResources).toEqual([]);
      expect(
        overview.characters[0]!.resources[0]!.snapshot?.quantity
      ).toBe(42);
    });

    it("conservatively omits the value when every captured snapshot's raw ownership evidence disagrees with the configured ACCOUNT_WIDE scope", async () => {
      const repository = new FakeResourceReadinessRepository();
      repository.seedCharacter({ id: "char-1", name: "Synlight" });
      repository.seedSnapshot({
        characterId: "char-1",
        resourceDefinitionId: "def-1",
        quantity: 500,
        accountWide: false,
        capturedAt: new Date()
      });

      const service = new ResourceReadinessService(
        repository,
        lookup([
          definition({
            id: "def-1",
            key: "warband-currency",
            ownershipScope: "ACCOUNT_WIDE"
          })
        ])
      );

      const overview = await service.getOverview();
      const resource = overview.accountResources[0]!;

      expect(resource.snapshot).toBeNull();
      expect(resource.ownershipMismatch).toBe(true);
    });

    it("still surfaces a trustworthy value and flags the mismatch when only some snapshots disagree", async () => {
      const repository = new FakeResourceReadinessRepository();
      repository.seedCharacter({ id: "char-1", name: "Synlight" });
      repository.seedCharacter({ id: "char-2", name: "Synbeast" });

      repository.seedSnapshot({
        characterId: "char-1",
        resourceDefinitionId: "def-1",
        quantity: 500,
        accountWide: false,
        capturedAt: new Date("2026-08-27T19:00:00.000Z")
      });

      repository.seedSnapshot({
        characterId: "char-2",
        resourceDefinitionId: "def-1",
        quantity: 620,
        accountWide: true,
        capturedAt: new Date("2026-08-27T21:00:00.000Z")
      });

      const service = new ResourceReadinessService(
        repository,
        lookup([
          definition({
            id: "def-1",
            key: "warband-currency",
            ownershipScope: "ACCOUNT_WIDE"
          })
        ])
      );

      const overview = await service.getOverview();
      const resource = overview.accountResources[0]!;

      expect(resource.snapshot?.quantity).toBe(620);
      expect(resource.ownershipMismatch).toBe(true);
    });
  });
});
