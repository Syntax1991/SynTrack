import { describe, expect, it } from "vitest";
import { FakeProfessionWeeklyStatusRepository } from "./profession-weekly-status.fakes.js";
import { ProfessionWeeklyStatusService } from "./profession-weekly-status.service.js";
import type { ProfessionWeeklySourceDefinitionView } from "./profession-weekly-definition.types.js";

function definition(
  overrides: Partial<ProfessionWeeklySourceDefinitionView> & {
    id: string;
    professionKey: string;
    sourceKey: string;
  }
): ProfessionWeeklySourceDefinitionView {
  return {
    scopeKey: "MIDNIGHT-S2",
    name: overrides.sourceKey,
    sourceType: "WEEKLY_QUEST",
    externalQuestId: 1,
    externalCurrencyId: null,
    enabled: true,
    sortOrder: 0,
    ...overrides
  };
}

function lookup(
  definitions: ProfessionWeeklySourceDefinitionView[]
) {
  return {
    listEnabledForActiveSeason: async () => definitions
  };
}

describe("ProfessionWeeklyStatusService", () => {
  it("reports NOT_TRACKED-equivalent zero aggregate for a character with no applicable definitions", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.profKp.applicableTotal).toBe(0);
    expect(character.professions).toHaveLength(0);
  });

  it("derives Prof KP from Weekly Quest + Treatise only, excluding Knowledge Drops", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-quest",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-treatise",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    // Critical regression case: Drops is INCOMPLETE, but must never
    // affect Prof KP - the hard product rule has no exceptions.
    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-drops",
      state: "INCOMPLETE",
      currentValue: 1,
      maxValue: 2,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([
        definition({
          id: "def-quest",
          professionKey: "alchemy",
          sourceKey: "weekly-quest",
          sourceType: "WEEKLY_QUEST"
        }),
        definition({
          id: "def-treatise",
          professionKey: "alchemy",
          sourceKey: "treatise",
          sourceType: "TREATISE"
        }),
        definition({
          id: "def-drops",
          professionKey: "alchemy",
          sourceKey: "knowledge-drops",
          sourceType: "KNOWLEDGE_DROPS",
          externalQuestId: null,
          externalCurrencyId: 1
        })
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.profKp).toEqual({
      completeCount: 2,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 2
    });

    expect(character.drops).toEqual({
      completeCount: 0,
      incompleteCount: 1,
      unknownCount: 0,
      applicableTotal: 1
    });

    const alchemy = character.professions[0]!;
    expect(alchemy.name).toBe("Alchemy");
    expect(alchemy.profKp.applicableTotal).toBe(2);
    expect(alchemy.drops?.state).toBe("INCOMPLETE");
    expect(alchemy.drops?.currentValue).toBe(1);
    expect(alchemy.drops?.maxValue).toBe(2);
  });

  it("aggregates two professions independently into one character-level Prof KP", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy", "blacksmithing"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");
    repository.seedProfessionName(
      "blacksmithing",
      "Blacksmithing"
    );

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-alchemy-quest",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-alchemy-treatise",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-bs-quest",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    // Blacksmithing's Treatise is left uncaptured entirely (no snapshot
    // row) - must resolve to UNKNOWN, never a silently-assumed INCOMPLETE.

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([
        definition({
          id: "def-alchemy-quest",
          professionKey: "alchemy",
          sourceKey: "weekly-quest"
        }),
        definition({
          id: "def-alchemy-treatise",
          professionKey: "alchemy",
          sourceKey: "treatise",
          sourceType: "TREATISE"
        }),
        definition({
          id: "def-bs-quest",
          professionKey: "blacksmithing",
          sourceKey: "weekly-quest"
        }),
        definition({
          id: "def-bs-treatise",
          professionKey: "blacksmithing",
          sourceKey: "treatise",
          sourceType: "TREATISE"
        })
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    // 3/4 known-applicable sources, matching the audit's own worked
    // example (Alchemy 2/2, Blacksmithing 1/2 -> character PROF KP 3/4).
    expect(character.profKp).toEqual({
      completeCount: 3,
      incompleteCount: 0,
      unknownCount: 1,
      applicableTotal: 4
    });

    const blacksmithing = character.professions.find(
      (profession) =>
        profession.professionKey === "blacksmithing"
    )!;

    const treatiseStatus = blacksmithing.sources.find(
      (candidate) => candidate.sourceKey === "treatise"
    );

    expect(treatiseStatus?.state).toBe("UNKNOWN");
  });

  it("never shows a profession the character doesn't actually have, even if it's enabled for other characters", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synfel",
      professionKeys: ["inscription"]
    });
    repository.seedProfessionName("inscription", "Inscription");
    repository.seedProfessionName("alchemy", "Alchemy");

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-inscription-quest",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([
        definition({
          id: "def-inscription-quest",
          professionKey: "inscription",
          sourceKey: "weekly-quest"
        }),
        // Alchemy is enabled account-wide (e.g. another character has
        // it), but Synfel doesn't practice Alchemy at all - it must
        // never appear as a phantom UNKNOWN entry for this character.
        definition({
          id: "def-alchemy-quest",
          professionKey: "alchemy",
          sourceKey: "weekly-quest"
        })
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.profKp).toEqual({
      completeCount: 1,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 1
    });

    expect(character.professions).toHaveLength(1);
    expect(character.professions[0]!.professionKey).toBe(
      "inscription"
    );
  });

  it("never counts a disabled/unconfigured source in applicableTotal", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });
    repository.seedProfessionName("alchemy", "Alchemy");

    const service = new ProfessionWeeklyStatusService(
      repository,
      // listEnabledForActiveSeason already filters to enabled=true -
      // simulating that a disabled/unverified definition simply never
      // reaches this service at all.
      lookup([])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.profKp.applicableTotal).toBe(0);
    expect(character.drops.applicableTotal).toBe(0);
  });
});
