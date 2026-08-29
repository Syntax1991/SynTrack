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

describe("ProfessionWeeklyStatusService", () => {
  it("reports a zero aggregate (no dash-worthy applicable sources) for a character with no professions", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.quest.applicableTotal).toBe(0);
    expect(character.treatise.applicableTotal).toBe(0);
    expect(character.professions).toHaveLength(0);
  });

  it("keeps Weekly Quest and Treatise as two separate aggregates, both complete, for one profession", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");

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

    // Critical regression case: Drops is INCOMPLETE, but must never
    // affect Quest or Treatise - the hard product rule has no
    // exceptions.
    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-drops",
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
        definition({
          id: "def-drops",
          professionKey: "alchemy",
          sourceKey: "knowledge-drops-1",
          sourceType: "KNOWLEDGE_DROPS"
        })
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

    expect(character.treatise).toEqual({
      completeCount: 1,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 1
    });

    expect(character.drops).toEqual({
      completeCount: 0,
      incompleteCount: 1,
      unknownCount: 0,
      applicableTotal: 1
    });

    const alchemy = character.professions[0]!;
    expect(alchemy.name).toBe("Alchemy");
    expect(alchemy.quest?.state).toBe("COMPLETE");
    expect(alchemy.treatise?.state).toBe("COMPLETE");
    expect(alchemy.drops?.state).toBe("INCOMPLETE");
    expect(alchemy.drops?.currentValue).toBe(0);
    expect(alchemy.drops?.maxValue).toBe(1);
  });

  it("merges multiple Knowledge Drops slots into one current/max status per profession", async () => {
    const repository = new FakeProfessionWeeklyStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synwake",
      professionKeys: ["enchanting"]
    });
    repository.seedProfessionName("enchanting", "Enchanting");

    // Enchanting has 4 independent Knowledge Drops slots (two single
    // treasure ids + a 5-alternate gathering group + a capstone) - see
    // ProfessionWeeklyCatalog.lua. Two are complete here.
    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-drops-1",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T10:00:00.000Z")
    });

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-drops-2",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T11:00:00.000Z")
    });

    repository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-drops-3",
      state: "INCOMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    // The fourth slot (capstone) is left uncaptured entirely - the
    // whole group must resolve UNKNOWN, never silently 2/3.

    const service = new ProfessionWeeklyStatusService(
      repository,
      lookup([
        definition({
          id: "def-drops-1",
          professionKey: "enchanting",
          sourceKey: "knowledge-drops-1",
          sourceType: "KNOWLEDGE_DROPS"
        }),
        definition({
          id: "def-drops-2",
          professionKey: "enchanting",
          sourceKey: "knowledge-drops-2",
          sourceType: "KNOWLEDGE_DROPS"
        }),
        definition({
          id: "def-drops-3",
          professionKey: "enchanting",
          sourceKey: "knowledge-drops-3",
          sourceType: "KNOWLEDGE_DROPS"
        }),
        definition({
          id: "def-drops-4",
          professionKey: "enchanting",
          sourceKey: "knowledge-drops-4",
          sourceType: "KNOWLEDGE_DROPS"
        })
      ])
    );

    const overview = await service.getOverview();
    const enchanting = overview.characters[0]!.professions[0]!;

    expect(enchanting.drops?.state).toBe("UNKNOWN");
    expect(enchanting.drops?.currentValue).toBe(2);
    expect(enchanting.drops?.maxValue).toBe(4);
  });

  it("shows Quest 2/2 and Treatise 2/2 for a character with two professions, both sources complete on both", async () => {
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
      completeCount: 2,
      incompleteCount: 0,
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

});
