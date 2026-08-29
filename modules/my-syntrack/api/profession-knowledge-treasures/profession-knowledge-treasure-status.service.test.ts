import { describe, expect, it } from "vitest";
import { FakeProfessionKnowledgeTreasureStatusRepository } from "./profession-knowledge-treasure-status.fakes.js";
import { ProfessionKnowledgeTreasureStatusService } from "./profession-knowledge-treasure-status.service.js";
import type { ProfessionKnowledgeTreasureDefinitionView } from "./profession-knowledge-treasure-definition.types.js";

function definition(
  overrides: Partial<ProfessionKnowledgeTreasureDefinitionView> & {
    id: string;
    professionKey: string;
    sourceKey: string;
  }
): ProfessionKnowledgeTreasureDefinitionView {
  return {
    scopeKey: "MIDNIGHT-S2",
    name: overrides.sourceKey,
    externalQuestId: 1,
    knowledgePoints: 3,
    enabled: true,
    sortOrder: 0,
    ...overrides
  };
}

function lookup(
  definitions: ProfessionKnowledgeTreasureDefinitionView[]
) {
  return {
    listEnabledForActiveSeason: async () => definitions
  };
}

function eightAlchemyDefinitions() {
  return Array.from({ length: 8 }, (_, index) =>
    definition({
      id: `def-alchemy-${index + 1}`,
      professionKey: "alchemy",
      sourceKey: `treasure-${index + 1}`
    })
  );
}

describe("ProfessionKnowledgeTreasureStatusService", () => {
  it("reports 8/8 COMPLETE when every treasure is flagged complete", async () => {
    const repository =
      new FakeProfessionKnowledgeTreasureStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");

    for (let index = 1; index <= 8; index += 1) {
      repository.seedSnapshot({
        characterId: "char-1",
        definitionId: `def-alchemy-${index}`,
        state: "COMPLETE",
        capturedAt: new Date("2026-08-29T12:00:00.000Z")
      });
    }

    const service = new ProfessionKnowledgeTreasureStatusService(
      repository,
      lookup(eightAlchemyDefinitions())
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.treasures).toEqual({
      completeCount: 8,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 8
    });

    const alchemy = character.professions[0]!;
    expect(alchemy.name).toBe("Alchemy");
    expect(alchemy.treasures).toEqual({
      completeCount: 8,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 8
    });
    expect(alchemy.sources).toHaveLength(8);
    expect(
      alchemy.sources.every((source) => source.state === "COMPLETE")
    ).toBe(true);
  });

  it("shows one incomplete treasure distinctly from the other seven complete", async () => {
    const repository =
      new FakeProfessionKnowledgeTreasureStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");

    for (let index = 1; index <= 7; index += 1) {
      repository.seedSnapshot({
        characterId: "char-1",
        definitionId: `def-alchemy-${index}`,
        state: "COMPLETE",
        capturedAt: new Date("2026-08-29T12:00:00.000Z")
      });
    }

    repository.seedSnapshot({
      characterId: "char-1",
      definitionId: "def-alchemy-8",
      state: "INCOMPLETE",
      capturedAt: new Date("2026-08-29T12:00:00.000Z")
    });

    const service = new ProfessionKnowledgeTreasureStatusService(
      repository,
      lookup(eightAlchemyDefinitions())
    );

    const overview = await service.getOverview();
    const alchemy = overview.characters[0]!.professions[0]!;

    expect(alchemy.treasures).toEqual({
      completeCount: 7,
      incompleteCount: 1,
      unknownCount: 0,
      applicableTotal: 8
    });

    const missing = alchemy.sources.find(
      (source) => source.sourceKey === "treasure-8"
    );
    expect(missing?.state).toBe("INCOMPLETE");
  });

  it("reports an uncaptured treasure as UNKNOWN, never silently INCOMPLETE - 7 known + 1 unknown stays honest", async () => {
    const repository =
      new FakeProfessionKnowledgeTreasureStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");

    for (let index = 1; index <= 7; index += 1) {
      repository.seedSnapshot({
        characterId: "char-1",
        definitionId: `def-alchemy-${index}`,
        state: "COMPLETE",
        capturedAt: new Date("2026-08-29T12:00:00.000Z")
      });
    }

    // def-alchemy-8 is left uncaptured entirely.

    const service = new ProfessionKnowledgeTreasureStatusService(
      repository,
      lookup(eightAlchemyDefinitions())
    );

    const overview = await service.getOverview();
    const alchemy = overview.characters[0]!.professions[0]!;

    expect(alchemy.treasures).toEqual({
      completeCount: 7,
      incompleteCount: 0,
      unknownCount: 1,
      applicableTotal: 8
    });
  });

  it("aggregates 0 applicable treasures for a character with no professions", async () => {
    const repository =
      new FakeProfessionKnowledgeTreasureStatusRepository();
    repository.seedCharacter({ id: "char-1", name: "Synlight" });

    const service = new ProfessionKnowledgeTreasureStatusService(
      repository,
      lookup([])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.treasures.applicableTotal).toBe(0);
    expect(character.professions).toHaveLength(0);
  });

  it("aggregates two professions into 16/16 when both are fully complete", async () => {
    const repository =
      new FakeProfessionKnowledgeTreasureStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy", "engineering"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");
    repository.seedProfessionName("engineering", "Engineering");

    const definitions = [
      ...eightAlchemyDefinitions(),
      ...Array.from({ length: 8 }, (_, index) =>
        definition({
          id: `def-engineering-${index + 1}`,
          professionKey: "engineering",
          sourceKey: `treasure-${index + 1}`
        })
      )
    ];

    for (const def of definitions) {
      repository.seedSnapshot({
        characterId: "char-1",
        definitionId: def.id,
        state: "COMPLETE",
        capturedAt: new Date("2026-08-29T12:00:00.000Z")
      });
    }

    const service = new ProfessionKnowledgeTreasureStatusService(
      repository,
      lookup(definitions)
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.treasures).toEqual({
      completeCount: 16,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 16
    });
  });

  it("shows a partial 15/16 when one profession has 8/8 and the other 7/8", async () => {
    const repository =
      new FakeProfessionKnowledgeTreasureStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy", "engineering"]
    });
    repository.seedProfessionName("alchemy", "Alchemy");
    repository.seedProfessionName("engineering", "Engineering");

    const engineeringDefinitions = Array.from(
      { length: 8 },
      (_, index) =>
        definition({
          id: `def-engineering-${index + 1}`,
          professionKey: "engineering",
          sourceKey: `treasure-${index + 1}`
        })
    );

    const definitions = [
      ...eightAlchemyDefinitions(),
      ...engineeringDefinitions
    ];

    for (let index = 1; index <= 8; index += 1) {
      repository.seedSnapshot({
        characterId: "char-1",
        definitionId: `def-alchemy-${index}`,
        state: "COMPLETE",
        capturedAt: new Date("2026-08-29T12:00:00.000Z")
      });
    }

    for (let index = 1; index <= 7; index += 1) {
      repository.seedSnapshot({
        characterId: "char-1",
        definitionId: `def-engineering-${index}`,
        state: "COMPLETE",
        capturedAt: new Date("2026-08-29T12:00:00.000Z")
      });
    }

    repository.seedSnapshot({
      characterId: "char-1",
      definitionId: "def-engineering-8",
      state: "INCOMPLETE",
      capturedAt: new Date("2026-08-29T12:00:00.000Z")
    });

    const service = new ProfessionKnowledgeTreasureStatusService(
      repository,
      lookup(definitions)
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.treasures).toEqual({
      completeCount: 15,
      incompleteCount: 1,
      unknownCount: 0,
      applicableTotal: 16
    });
  });

  it("never shows a profession the character doesn't actually have, even if it's enabled for other characters", async () => {
    const repository =
      new FakeProfessionKnowledgeTreasureStatusRepository();
    repository.seedCharacter({
      id: "char-1",
      name: "Synfel",
      professionKeys: ["inscription"]
    });
    repository.seedProfessionName("inscription", "Inscription");
    repository.seedProfessionName("alchemy", "Alchemy");

    const service = new ProfessionKnowledgeTreasureStatusService(
      repository,
      lookup([
        definition({
          id: "def-inscription-1",
          professionKey: "inscription",
          sourceKey: "treasure-1"
        }),
        // Alchemy is enabled account-wide, but Synfel doesn't
        // practice it - must never appear as a phantom entry.
        definition({
          id: "def-alchemy-1",
          professionKey: "alchemy",
          sourceKey: "treasure-1"
        })
      ])
    );

    const overview = await service.getOverview();
    const character = overview.characters[0]!;

    expect(character.professions).toHaveLength(1);
    expect(character.professions[0]!.professionKey).toBe(
      "inscription"
    );
  });
});
