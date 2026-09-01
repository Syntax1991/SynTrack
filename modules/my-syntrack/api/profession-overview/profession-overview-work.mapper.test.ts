import { describe, expect, it } from "vitest";
import type { ProfessionKnowledgeTreasureProfessionSummary } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";
import type { ProfessionWeeklyProfessionSummary } from "../profession-weekly/profession-weekly-status.types.js";
import { buildProfessionOverviewWorkRow } from "./profession-overview-work.mapper.js";
import type { ProfessionOverviewWorkAssignment } from "./profession-overview-work.types.js";

function assignment(
  overrides: Partial<ProfessionOverviewWorkAssignment> = {}
): ProfessionOverviewWorkAssignment {
  return {
    characterId: "char-1",
    characterName: "Synblast",
    realm: "Silvermoon",
    region: "EU",
    className: "Mage",
    professionId: "prof-alchemy",
    professionKey: "alchemy",
    professionName: "Alchemy",
    professionCategory: "CRAFTING",
    skill: 100,
    knowledgePoints: 0,
    ...overrides
  };
}

function weeklyProfession(
  overrides: Partial<ProfessionWeeklyProfessionSummary> = {}
): ProfessionWeeklyProfessionSummary {
  return {
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
    },
    ...overrides
  };
}

function treasureProfession(
  overrides: Partial<ProfessionKnowledgeTreasureProfessionSummary> = {}
): ProfessionKnowledgeTreasureProfessionSummary {
  return {
    professionKey: "alchemy",
    name: "Alchemy",
    treasures: {
      completeCount: 8,
      incompleteCount: 0,
      unknownCount: 0,
      applicableTotal: 8
    },
    sources: [],
    ...overrides
  };
}

describe("ProfessionOverviewWork mapper fixtures", () => {
  it("fixture A: complete crafting profession is weekly-complete with no weekly attention", () => {
    const row = buildProfessionOverviewWorkRow({
      assignment: assignment(),
      weeklyProfession: weeklyProfession(),
      treasureProfession: treasureProfession()
    });

    expect(row.weekly.state).toBe("COMPLETE");
    expect(row.weekly.summary).toBe("✓");
    expect(row.attention.weekly).toBe(false);
    expect(row.attention.permanent).toBe(false);
    expect(row.nextAction).toBe("Weekly complete");
  });

  it("fixture B: partial weekly attention points to remaining Drops", () => {
    const row = buildProfessionOverviewWorkRow({
      assignment: assignment(),
      weeklyProfession: weeklyProfession({
        drops: {
          sourceKey: "drops",
          name: "Knowledge Drops",
          sourceType: "KNOWLEDGE_DROPS",
          state: "INCOMPLETE",
          currentValue: 0,
          maxValue: 2,
          capturedAt: null
        }
      }),
      treasureProfession: treasureProfession()
    });

    expect(row.weekly.state).toBe("ATTENTION");
    expect(row.drops.label).toBe("0/2");
    expect(row.nextAction).toBe(
      "2 Knowledge Drops remaining"
    );
  });

  it("fixture C: weekly complete while permanent treasure attention remains", () => {
    const row = buildProfessionOverviewWorkRow({
      assignment: assignment(),
      weeklyProfession: weeklyProfession(),
      treasureProfession: treasureProfession({
        treasures: {
          completeCount: 7,
          incompleteCount: 1,
          unknownCount: 0,
          applicableTotal: 8
        }
      })
    });

    expect(row.weekly.state).toBe("COMPLETE");
    expect(row.treasures.label).toBe("7/8");
    expect(row.attention.weekly).toBe(false);
    expect(row.attention.permanent).toBe(true);
    expect(row.nextAction).toBe(
      "1 Knowledge Treasure missing"
    );
  });

  it("fixture D: unresolved weekly evidence renders UNKNOWN, not incomplete", () => {
    const row = buildProfessionOverviewWorkRow({
      assignment: assignment(),
      weeklyProfession: weeklyProfession({
        quest: {
          sourceKey: "weekly-quest",
          name: "Weekly Quest",
          sourceType: "WEEKLY_QUEST",
          state: "UNKNOWN",
          currentValue: null,
          maxValue: null,
          capturedAt: null
        }
      }),
      treasureProfession: treasureProfession()
    });

    expect(row.quest.state).toBe("UNKNOWN");
    expect(row.quest.label).toBe("?");
    expect(row.weekly.state).toBe("UNKNOWN");
    expect(row.weekly.summary).toBe("?");
    expect(row.nextAction).not.toBe("Complete weekly quest");
  });

  it("fixture E: known zero drops renders as known zero, not UNKNOWN", () => {
    const row = buildProfessionOverviewWorkRow({
      assignment: assignment(),
      weeklyProfession: weeklyProfession({
        drops: {
          sourceKey: "drops",
          name: "Knowledge Drops",
          sourceType: "KNOWLEDGE_DROPS",
          state: "INCOMPLETE",
          currentValue: 0,
          maxValue: 1,
          capturedAt: null
        }
      }),
      treasureProfession: treasureProfession()
    });

    expect(row.drops.label).toBe("0/1");
    expect(row.drops.state).toBe("INCOMPLETE");
  });

  it("fixture H: gathering profession uses NOT_APPLICABLE for missing weekly sources", () => {
    const row = buildProfessionOverviewWorkRow({
      assignment: assignment({
        professionKey: "herbalism",
        professionName: "Herbalism",
        professionCategory: "GATHERING"
      }),
      weeklyProfession: null,
      treasureProfession: null
    });

    expect(row.quest.label).toBe("—");
    expect(row.treatise.label).toBe("—");
    expect(row.drops.label).toBe("—");
    expect(row.treasures.label).toBe("—");
  });
});
