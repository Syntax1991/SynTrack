import { describe, expect, it } from "vitest";
import { CharacterProfessionAuthorityService } from "../character-external-sync/character-profession-authority.service.js";
import { resolveProfessionWeeklyOverviewState } from "../overview/overview-profession-weekly-state.mapper.js";
import { FakeProfessionKnowledgeTreasureStatusRepository } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.fakes.js";
import { ProfessionKnowledgeTreasureStatusService } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.service.js";
import { FakeProfessionWeeklyStatusRepository } from "../profession-weekly/profession-weekly-status.fakes.js";
import { ProfessionWeeklyStatusService } from "../profession-weekly/profession-weekly-status.service.js";
import type { ProfessionWeeklySourceDefinitionView } from "../profession-weekly/profession-weekly-definition.types.js";
import { ProfessionOverviewWorkService } from "./profession-overview-work.service.js";
import type { ProfessionOverviewWorkAssignment } from "./profession-overview-work.types.js";

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

describe("ProfessionOverviewWork Weeklies consistency", () => {
  it("keeps Profession Overview Drops aligned with Weeklies canonical weekly read model", async () => {
    const weeklyRepository =
      new FakeProfessionWeeklyStatusRepository();
    weeklyRepository.seedCharacter({
      id: "char-1",
      name: "Synlight",
      professionKeys: ["alchemy"]
    });
    weeklyRepository.seedProfessionName("alchemy", "Alchemy");
    weeklyRepository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-alchemy-quest",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });
    weeklyRepository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-alchemy-treatise",
      state: "COMPLETE",
      currentValue: null,
      maxValue: null,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });
    weeklyRepository.seedSnapshot({
      characterId: "char-1",
      sourceDefinitionId: "def-alchemy-drops",
      state: "INCOMPLETE",
      currentValue: 0,
      maxValue: 2,
      capturedAt: new Date("2026-08-28T12:00:00.000Z")
    });

    const weeklyDefinitions = [
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
      })
    ];

    const weeklyService = new ProfessionWeeklyStatusService(
      weeklyRepository,
      {
        listEnabledForActiveSeason: async () =>
          weeklyDefinitions
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
          characterId: "char-1",
          characterName: "Synlight",
          realm: "Silvermoon",
          region: "EU",
          className: "Mage",
          professionId: "prof-alchemy",
          professionKey: "alchemy",
          professionName: "Alchemy",
          professionCategory: "CRAFTING",
          skill: 100,
          knowledgePoints: 0
        }
      ]),
      weeklyService,
      treasureService,
      new FakeProfessionCraftLookup(),
      // No Blizzard snapshot exists for this fake character id - the
      // authority service falls back to the addon-provided skill unchanged,
      // keeping this test hermetic (no real Prisma-backed
      // CharacterExternalSnapshotRepository round trip).
      new CharacterProfessionAuthorityService({
        findOne: async () => null
      } as never)
    );

    const [weeklyOverview, professionOverview] =
      await Promise.all([
        weeklyService.getOverview(),
        service.getOverview()
      ]);

    const weekliesCharacter =
      weeklyOverview.characters[0]!;
    const weekliesState =
      resolveProfessionWeeklyOverviewState(
        weekliesCharacter
      ).professionWeekly;

    const overviewRow = professionOverview.rows[0]!;
    const weekliesProfession =
      weekliesCharacter.professions[0]!;

    expect(overviewRow.drops.state).toBe(
      weekliesProfession.drops?.state
    );
    expect(overviewRow.drops.source?.currentValue).toBe(
      weekliesProfession.drops?.currentValue
    );
    expect(overviewRow.drops.source?.maxValue).toBe(
      weekliesProfession.drops?.maxValue
    );
    expect(overviewRow.drops.label).toBe(
      `${weekliesProfession.drops?.currentValue}/${weekliesProfession.drops?.maxValue}`
    );
    expect(weekliesCharacter.drops).toEqual(
      weekliesState.drops
    );
  });
});
