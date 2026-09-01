import { describe, expect, it } from "vitest";
import {
  deriveProfessionNextAction,
  deriveProfessionSortRank
} from "./profession-overview-work.action.mapper.js";
import { buildProfessionOverviewWorkRow, rowNeedsAttention } from "./profession-overview-work.mapper.js";
import { resolveInvestedKnowledgeDisplay } from "./profession-overview-work.knowledge.js";

describe("ProfessionOverviewWork knowledge semantics", () => {
  it("treats CharacterProfession.knowledgePoints as invested knowledge, not unspent", () => {
    expect(
      resolveInvestedKnowledgeDisplay(120)
    ).toEqual({
      meaning: "INVESTED",
      invested: 120,
      display: "120"
    });
  });

  it("does not generate KP unspent actions for high invested totals", () => {
    expect(
      deriveProfessionNextAction({
        quest: {
          state: "COMPLETE",
          label: "✓",
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
          state: "COMPLETE",
          label: "8/8",
          aggregate: null
        },
        weeklyState: "COMPLETE"
      })
    ).toBe("Weekly complete");
  });

  it("does not rank invested knowledge ahead of complete rows", () => {
    expect(
      deriveProfessionSortRank({
        weeklyState: "COMPLETE",
        treasures: {
          state: "COMPLETE",
          label: "8/8",
          aggregate: null
        }
      })
    ).toBe(3);
  });

  it("does not mark attention for invested knowledge alone", () => {
    const row = buildProfessionOverviewWorkRow({
      assignment: {
        characterId: "char-1",
        characterName: "Synblast",
        realm: "Antonidas",
        region: "EU",
        className: "Mage",
        professionId: "prof-alchemy",
        professionKey: "alchemy",
        professionName: "Alchemy",
        professionCategory: "CRAFTING",
        skill: 100,
        knowledgePoints: 120
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
      treasureProfession: {
        professionKey: "alchemy",
        name: "Alchemy",
        treasures: {
          completeCount: 8,
          incompleteCount: 0,
          unknownCount: 0,
          applicableTotal: 8
        },
        sources: []
      }
    });

    expect(row.investedKnowledge.meaning).toBe("INVESTED");
    expect(rowNeedsAttention(row)).toBe(false);
    expect(row.nextAction).toBe("Weekly complete");
  });
});
