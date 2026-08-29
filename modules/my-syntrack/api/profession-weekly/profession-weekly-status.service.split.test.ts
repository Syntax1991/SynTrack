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

function questDefinition(
  professionKey: string
) {
  return definition({
    id: `def-${professionKey}-quest`,
    professionKey,
    sourceKey: "weekly-quest",
    sourceType: "WEEKLY_QUEST"
  });
}

function treatiseDefinition(
  professionKey: string
) {
  return definition({
    id: `def-${professionKey}-treatise`,
    professionKey,
    sourceKey: "treatise",
    sourceType: "TREATISE"
  });
}

describe("ProfessionWeeklyStatusService (separated status, continued)", () => {
  it("shows a partial Quest (1/2) while Treatise stays fully complete (2/2)", async () => {
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
      sourceDefinitionId: "def-blacksmithing-quest",
      state: "INCOMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    for (const professionKey of [
      "alchemy",
      "blacksmithing"
    ]) {
      repository.seedSnapshot({
        characterId: "char-1",
        sourceDefinitionId: `def-${professionKey}-treatise`,
        state: "COMPLETE",
        currentValue: null,
        maxValue: null,
        capturedAt: new Date("2026-08-28T12:00:00.000Z")
      });
    }

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([
        questDefinition("alchemy"),
        treatiseDefinition("alchemy"),
        questDefinition("blacksmithing"),
        treatiseDefinition("blacksmithing")
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.quest).toEqual({
      completeCount: 1,
      incompleteCount: 1,
      unknownCount: 0,
      applicableTotal: 2
    });

    expect(character.treatise).toEqual({
      completeCount: 2,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 2
    });
  });

  it("shows a partial Treatise (1/2) while Quest stays fully complete (2/2)", async () => {
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

    for (const professionKey of [
      "alchemy",
      "blacksmithing"
    ]) {
      repository.seedSnapshot({
        characterId: "char-1",
        sourceDefinitionId: `def-${professionKey}-quest`,
        state: "COMPLETE",
        currentValue: null,
        maxValue: null,
        capturedAt: new Date("2026-08-28T12:00:00.000Z")
      });
    }

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
      sourceDefinitionId: "def-blacksmithing-treatise",
      state: "INCOMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([
        questDefinition("alchemy"),
        treatiseDefinition("alchemy"),
        questDefinition("blacksmithing"),
        treatiseDefinition("blacksmithing")
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.quest).toEqual({
      completeCount: 2,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 2
    });

    expect(character.treatise).toEqual({
      completeCount: 1,
      incompleteCount: 1,
      unknownCount: 0,
      applicableTotal: 2
    });
  });

  it("reports UNKNOWN honestly for an uncaptured source, never silently assuming INCOMPLETE", async () => {
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

    // Blacksmithing's Weekly Quest is left uncaptured entirely (no
    // snapshot row) - must resolve to UNKNOWN.

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([
        questDefinition("alchemy"),
        questDefinition("blacksmithing")
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.quest).toEqual({
      completeCount: 1,
      incompleteCount: 0,
      unknownCount: 1,
      applicableTotal: 2
    });

    const blacksmithing = character.professions.find(
      (profession) =>
        profession.professionKey === "blacksmithing"
    )!;

    expect(blacksmithing.quest?.state).toBe("UNKNOWN");
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
        questDefinition("inscription"),
        // Alchemy is enabled account-wide (e.g. another character has
        // it), but Synfel doesn't practice Alchemy at all - it must
        // never appear as a phantom UNKNOWN entry for this character.
        questDefinition("alchemy")
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.quest).toEqual({
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

    expect(character.quest.applicableTotal).toBe(0);
    expect(character.treatise.applicableTotal).toBe(0);
    expect(character.drops.applicableTotal).toBe(0);
  });
});
