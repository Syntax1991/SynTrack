import { describe, expect, it } from "vitest";
import {
  deriveProfessionNextAction,
  deriveProfessionSortRank
} from "./profession-overview-work.action.mapper.js";
import {
  buildProfessionOverviewWorkRow,
  buildProfessionOverviewWorkSummary,
  rowNeedsAttention,
  sortProfessionOverviewWorkRows
} from "./profession-overview-work.mapper.js";
import {
  resolveProfessionWeeklyRowState,
  resolveProfessionWeeklySummary
} from "./profession-overview-work.weekly.mapper.js";

describe("ProfessionOverviewWork mapper ordering", () => {
  it("prioritizes weekly attention before permanent treasure", () => {
    expect(
      deriveProfessionSortRank({
        weeklyState: "ATTENTION",
        treasures: {
          state: "INCOMPLETE",
          label: "7/8",
          aggregate: null
        }
      })
    ).toBeLessThan(
      deriveProfessionSortRank({
        weeklyState: "COMPLETE",
        treasures: {
          state: "INCOMPLETE",
          label: "7/8",
          aggregate: null
        }
      })
    );

    expect(
      deriveProfessionNextAction({
        quest: {
          state: "INCOMPLETE",
          label: "!",
          source: null
        },
        treatise: {
          state: "COMPLETE",
          label: "✓",
          source: null
        },
        drops: {
          state: "COMPLETE",
          label: "✓",
          source: null
        },
        treasures: {
          state: "INCOMPLETE",
          label: "7/8",
          aggregate: {
            completeCount: 7,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 8
          }
        },
        weeklyState: "ATTENTION"
      })
    ).toBe("Complete weekly quest");
  });

  it("sorts attention rows before complete rows with stable name ordering", () => {
    const rows = sortProfessionOverviewWorkRows([
      buildProfessionOverviewWorkRow({
        assignment: {
          characterId: "char-1",
          characterName: "Beta",
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
        weeklyProfession: {
          professionKey: "alchemy",
          name: "Alchemy",
          quest: {
            sourceKey: "weekly-quest",
            name: "Weekly Quest",
            sourceType: "WEEKLY_QUEST",
            state: "COMPLETE",
            currentValue: null,
            maxValue: null,
            capturedAt: null
          },
          treatise: {
            sourceKey: "treatise",
            name: "Treatise",
            sourceType: "TREATISE",
            state: "COMPLETE",
            currentValue: null,
            maxValue: null,
            capturedAt: null
          },
          drops: {
            sourceKey: "drops",
            name: "Knowledge Drops",
            sourceType: "KNOWLEDGE_DROPS",
            state: "COMPLETE",
            currentValue: 1,
            maxValue: 1,
            capturedAt: null
          }
        },
        treasureProfession: null
      }),
      buildProfessionOverviewWorkRow({
        assignment: {
          characterId: "char-1",
          characterName: "Alpha",
          realm: "Silvermoon",
          region: "EU",
          className: "Mage",
          level: 90,
          professionId: "prof-tailoring",
          professionKey: "tailoring",
          professionName: "Tailoring",
          professionCategory: "CRAFTING",
          skill: 100,
          knowledgePoints: 0
        },
        weeklyProfession: {
          professionKey: "tailoring",
          name: "Tailoring",
          quest: {
            sourceKey: "weekly-quest",
            name: "Weekly Quest",
            sourceType: "WEEKLY_QUEST",
            state: "INCOMPLETE",
            currentValue: null,
            maxValue: null,
            capturedAt: null
          },
          treatise: null,
          drops: null
        },
        treasureProfession: null
      })
    ]);

    expect(rows[0]?.character.name).toBe("Alpha");
    expect(rows[0]?.weekly.state).toBe("ATTENTION");
    expect(rows[1]?.character.name).toBe("Beta");
    expect(rows[1]?.weekly.state).toBe("COMPLETE");
  });

  it("derives summary counts from rows", () => {
    const baseAssignment = {
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
    } as const;
    const completeRow = buildProfessionOverviewWorkRow({
      assignment: {
        characterId: "char-1",
        characterName: "Synblast",
        ...baseAssignment
      },
      weeklyProfession: {
        professionKey: "alchemy",
        name: "Alchemy",
        quest: {
          sourceKey: "weekly-quest",
          name: "Weekly Quest",
          sourceType: "WEEKLY_QUEST",
          state: "COMPLETE",
          currentValue: null,
          maxValue: null,
          capturedAt: null
        },
        treatise: null,
        drops: null
      },
      treasureProfession: null
    });
    const attentionRow = buildProfessionOverviewWorkRow({
      assignment: {
        characterId: "char-2",
        characterName: "Synbanks",
        ...baseAssignment
      },
      weeklyProfession: {
        professionKey: "alchemy",
        name: "Alchemy",
        quest: {
          sourceKey: "weekly-quest",
          name: "Weekly Quest",
          sourceType: "WEEKLY_QUEST",
          state: "INCOMPLETE",
          currentValue: null,
          maxValue: null,
          capturedAt: null
        },
        treatise: null,
        drops: null
      },
      treasureProfession: {
        professionKey: "alchemy",
        name: "Alchemy",
        treasures: {
          completeCount: 6,
          incompleteCount: 2,
          unknownCount: 0,
          applicableTotal: 8
        },
        sources: []
      }
    });

    const summary = buildProfessionOverviewWorkSummary({
      rows: [completeRow, attentionRow],
      craftingCoverage: { covered: 9, total: 11 }
    });

    expect(summary.professionCharacterCount).toBe(2);
    expect(summary.weeklyAttentionCount).toBe(1);
    expect(summary.permanentAttentionCount).toBe(1);
  });

  it("marks attention filter candidates for weekly and permanent only", () => {
    const weeklyRow = buildProfessionOverviewWorkRow({
      assignment: {
        characterId: "char-1",
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
      weeklyProfession: {
        professionKey: "alchemy",
        name: "Alchemy",
        quest: {
          sourceKey: "weekly-quest",
          name: "Weekly Quest",
          sourceType: "WEEKLY_QUEST",
          state: "INCOMPLETE",
          currentValue: null,
          maxValue: null,
          capturedAt: null
        },
        treatise: null,
        drops: null
      },
      treasureProfession: null
    });
    const kpRow = buildProfessionOverviewWorkRow({
      assignment: {
        characterId: "char-2",
        characterName: "Synbanks",
        realm: "Silvermoon",
        region: "EU",
        className: "Priest",
        level: 90,
        professionId: "prof-alchemy",
        professionKey: "alchemy",
        professionName: "Alchemy",
        professionCategory: "CRAFTING",
        skill: 100,
        knowledgePoints: 12
      },
      weeklyProfession: {
        professionKey: "alchemy",
        name: "Alchemy",
        quest: {
          sourceKey: "weekly-quest",
          name: "Weekly Quest",
          sourceType: "WEEKLY_QUEST",
          state: "COMPLETE",
          currentValue: null,
          maxValue: null,
          capturedAt: null
        },
        treatise: null,
        drops: null
      },
      treasureProfession: null
    });

    expect(rowNeedsAttention(weeklyRow)).toBe(true);
    expect(rowNeedsAttention(kpRow)).toBe(false);
  });

  it("resolves weekly summary for mixed open components", () => {
    expect(
      resolveProfessionWeeklySummary({
        quest: {
          state: "INCOMPLETE",
          label: "!",
          source: null
        },
        treatise: {
          state: "COMPLETE",
          label: "✓",
          source: null
        },
        drops: {
          state: "INCOMPLETE",
          label: "0/1",
          source: null
        },
        state: resolveProfessionWeeklyRowState({
          quest: {
            state: "INCOMPLETE",
            label: "!",
            source: null
          },
          treatise: {
            state: "COMPLETE",
            label: "✓",
            source: null
          },
          drops: {
            state: "INCOMPLETE",
            label: "0/1",
            source: null
          }
        })
      })
    ).toBe("Quest + Drop");
  });
});
