import { describe, expect, it } from "vitest";
import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import { CharacterProfileAuthorityService } from "../character-external-sync/character-profile-authority.service.js";
import { FakeProfessionKnowledgeTreasureStatusRepository } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.fakes.js";
import { ProfessionKnowledgeTreasureStatusService } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.service.js";
import { FakeProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.fakes.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import type { ProfessionWeeklySourceDefinitionView } from "../profession-weekly/profession-weekly-definition.types.js";
import { ProfessionOverviewWorkService } from "./profession-overview-work.service.js";
import type { ProfessionOverviewWorkAssignment } from "./profession-overview-work.types.js";

// No Blizzard snapshot ever exists for these fake character ids - the
// authority service falls back to the addon-provided skill unchanged
// (source: "ADDON"), so this fake keeps the test hermetic without ever
// touching a real Prisma-backed CharacterExternalSnapshotRepository.
function createNoSnapshotProfessionAuthorityService() {
  return new CharacterProfessionAuthorityService({
    findOne: async () => null
  } as never);
}

function createNoSnapshotProfileAuthorityService() {
  return new CharacterProfileAuthorityService({
    findOne: async () => null
  } as never);
}

class FakeProfessionOverviewWorkRepository {
  constructor(
    private readonly assignments: ProfessionOverviewWorkAssignment[] =
      []
  ) {}

  async findAssignments() {
    return this.assignments;
  }
}

class FakeProfessionCraftLookup {
  async getOverview() {
    return { items: [] };
  }
}

function weeklyDefinition(
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

function seedCompleteAlchemy(
  weeklyRepository: FakeProfessionWeeklyStatusRepository,
  characterId: string
) {
  weeklyRepository.seedSnapshot({
    characterId,
    sourceDefinitionId: "def-alchemy-quest",
    state: "COMPLETE",
    currentValue: null,
    maxValue: null,
    capturedAt: new Date("2026-08-28T12:00:00.000Z")
  });
  weeklyRepository.seedSnapshot({
    characterId,
    sourceDefinitionId: "def-alchemy-treatise",
    state: "COMPLETE",
    currentValue: null,
    maxValue: null,
    capturedAt: new Date("2026-08-28T12:00:00.000Z")
  });
  weeklyRepository.seedSnapshot({
    characterId,
    sourceDefinitionId: "def-alchemy-drops",
    state: "COMPLETE",
    currentValue: 1,
    maxValue: 1,
    capturedAt: new Date("2026-08-28T12:00:00.000Z")
  });
}

describe("ProfessionOverviewWorkService roster rows", () => {
  it("fixture F/G/I: dual-purpose, profession-only, and two-profession characters produce distinct rows", async () => {
    const weeklyRepository =
      new FakeProfessionWeeklyStatusRepository();
    weeklyRepository.seedCharacter({
      id: "char-main",
      name: "Synblast",
      professionKeys: ["alchemy", "leatherworking"]
    });
    weeklyRepository.seedCharacter({
      id: "char-prof",
      name: "Synbanks",
      professionKeys: ["tailoring"]
    });
    weeklyRepository.seedProfessionName("alchemy", "Alchemy");
    weeklyRepository.seedProfessionName(
      "leatherworking",
      "Leatherworking"
    );
    weeklyRepository.seedProfessionName("tailoring", "Tailoring");

    seedCompleteAlchemy(weeklyRepository, "char-main");
    weeklyRepository.seedSnapshot({
      characterId: "char-main",
      sourceDefinitionId: "def-lw-quest",
      state: "INCOMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });
    weeklyRepository.seedSnapshot({
      characterId: "char-prof",
      sourceDefinitionId: "def-tailoring-quest",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    const weeklyService = new ProfessionWeeklyStatusService(
      weeklyRepository,
      {
        listEnabledForActiveSeason: async () => [
          weeklyDefinition({
            id: "def-alchemy-quest",
            professionKey: "alchemy",
            sourceKey: "weekly-quest",
            sourceType: "WEEKLY_QUEST"
          }),
          weeklyDefinition({
            id: "def-alchemy-treatise",
            professionKey: "alchemy",
            sourceKey: "treatise",
            sourceType: "TREATISE"
          }),
          weeklyDefinition({
            id: "def-alchemy-drops",
            professionKey: "alchemy",
            sourceKey: "drops",
            sourceType: "KNOWLEDGE_DROPS"
          }),
          weeklyDefinition({
            id: "def-lw-quest",
            professionKey: "leatherworking",
            sourceKey: "weekly-quest",
            sourceType: "WEEKLY_QUEST"
          }),
          weeklyDefinition({
            id: "def-tailoring-quest",
            professionKey: "tailoring",
            sourceKey: "weekly-quest",
            sourceType: "WEEKLY_QUEST"
          })
        ]
      }
    );

    const treasureService =
      new ProfessionKnowledgeTreasureStatusService(
        new FakeProfessionKnowledgeTreasureStatusRepository(),
        {
          listEnabledForActiveSeason: async () => []
        }
      );

    const service = new ProfessionOverviewWorkService(
      new FakeProfessionOverviewWorkRepository([
        {
          characterId: "char-main",
          characterName: "Synblast",
          realm: "Silvermoon",
          region: "EU",
          className: "Mage",
          level: 90,
          professionId: "prof-alchemy",
          professionKey: "alchemy",
          professionName: "Alchemy",
          professionCategory: "CRAFTING",
          skill: 100,
          knowledgePoints: 0
        },
        {
          characterId: "char-main",
          characterName: "Synblast",
          realm: "Silvermoon",
          region: "EU",
          className: "Mage",
          level: 90,
          professionId: "prof-lw",
          professionKey: "leatherworking",
          professionName: "Leatherworking",
          professionCategory: "CRAFTING",
          skill: 82,
          knowledgePoints: 0
        },
        {
          characterId: "char-prof",
          characterName: "Synbanks",
          realm: "Silvermoon",
          region: "EU",
          className: "Priest",
          level: 90,
          professionId: "prof-tailoring",
          professionKey: "tailoring",
          professionName: "Tailoring",
          professionCategory: "CRAFTING",
          skill: 100,
          knowledgePoints: 0
        }
      ]),
      weeklyService,
      treasureService,
      new FakeProfessionCraftLookup(),
      createNoSnapshotProfessionAuthorityService(),
      createNoSnapshotProfileAuthorityService()
    );

    const overview = await service.getOverview();

    expect(overview.rows).toHaveLength(3);
    expect(overview.summary.professionCharacterCount).toBe(2);

    const synblastRows = overview.rows.filter(
      (row) => row.character.name === "Synblast"
    );
    expect(synblastRows).toHaveLength(2);
    expect(
      synblastRows.find(
        (row) => row.profession.key === "alchemy"
      )?.weekly.state
    ).toBe("COMPLETE");
    expect(
      synblastRows.find(
        (row) => row.profession.key === "leatherworking"
      )?.weekly.state
    ).toBe("ATTENTION");
  });
});
