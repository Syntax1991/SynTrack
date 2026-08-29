import { describe, expect, it } from "vitest";
import { resolveProfessionSetupOverviewState } from "./overview-profession-setup-state.mapper.js";
import type { CharacterProfessionKnowledgeTreasureStatus } from "../profession-knowledge-treasures/profession-knowledge-treasure-status.types.js";

const eightComplete = {
  completeCount: 8,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 8
};

describe("resolveProfessionSetupOverviewState", () => {
  it("is READY (PROF ✓) when both professions are 8/8 with tracked data", () => {
    const { professionSetup, attentionItem } =
      resolveProfessionSetupOverviewState({
        profession: {
          id: "char-1",
          name: "Synblast",
          hasTrackedProfession: true,
          partialProfessionIssues: [],
          professions: [
            {
              professionId: "alchemy",
              key: "alchemy",
              name: "Alchemy",
              category: "CRAFTING",
              skill: 100,
              knowledgePoints: 40,
              dataStatus: "TRACKED"
            },
            {
              professionId: "leatherworking",
              key: "leatherworking",
              name: "Leatherworking",
              category: "CRAFTING",
              skill: 100,
              knowledgePoints: 40,
              dataStatus: "TRACKED"
            }
          ]
        },
        treasures: {
          id: "char-1",
          name: "Synblast",
          treasures: {
            completeCount: 16,
            incompleteCount: 0,
            unknownCount: 0,
            applicableTotal: 16
          },
          professions: [
            {
              professionKey: "alchemy",
              name: "Alchemy",
              treasures: eightComplete,
              sources: []
            },
            {
              professionKey: "leatherworking",
              name: "Leatherworking",
              treasures: eightComplete,
              sources: []
            }
          ]
        }
      });

    expect(professionSetup.state).toBe("READY");
    expect(attentionItem).toBeNull();
  });

  it("is ATTENTION (PROF !) when one profession is 7/8", () => {
    const treasures: CharacterProfessionKnowledgeTreasureStatus = {
      id: "char-1",
      name: "Synblast",
      treasures: {
        completeCount: 15,
        incompleteCount: 1,
        unknownCount: 0,
        applicableTotal: 16
      },
      professions: [
        {
          professionKey: "alchemy",
          name: "Alchemy",
          treasures: eightComplete,
          sources: []
        },
        {
          professionKey: "leatherworking",
          name: "Leatherworking",
          treasures: {
            completeCount: 7,
            incompleteCount: 1,
            unknownCount: 0,
            applicableTotal: 8
          },
          sources: [
            {
              sourceKey: "treasure-8",
              name: "Treasure 8",
              state: "INCOMPLETE",
              capturedAt: null
            }
          ]
        }
      ]
    };

    const { professionSetup, attentionItem } =
      resolveProfessionSetupOverviewState({
        profession: {
          id: "char-1",
          name: "Synblast",
          hasTrackedProfession: true,
          partialProfessionIssues: [],
          professions: [
            {
              professionId: "alchemy",
              key: "alchemy",
              name: "Alchemy",
              category: "CRAFTING",
              skill: 100,
              knowledgePoints: 40,
              dataStatus: "TRACKED"
            },
            {
              professionId: "leatherworking",
              key: "leatherworking",
              name: "Leatherworking",
              category: "CRAFTING",
              skill: 100,
              knowledgePoints: 40,
              dataStatus: "TRACKED"
            }
          ]
        },
        treasures
      });

    expect(professionSetup.state).toBe("ATTENTION");
    expect(attentionItem?.label).toContain("Leatherworking");
  });

  it("is UNKNOWN when treasures are unresolved and nothing is proven incomplete", () => {
    const { professionSetup, attentionItem } =
      resolveProfessionSetupOverviewState({
        profession: {
          id: "char-1",
          name: "Synbeam",
          hasTrackedProfession: true,
          partialProfessionIssues: [],
          professions: [
            {
              professionId: "blacksmithing",
              key: "blacksmithing",
              name: "Blacksmithing",
              category: "CRAFTING",
              skill: 100,
              knowledgePoints: 10,
              dataStatus: "TRACKED"
            }
          ]
        },
        treasures: {
          id: "char-1",
          name: "Synbeam",
          treasures: {
            completeCount: 0,
            incompleteCount: 0,
            unknownCount: 8,
            applicableTotal: 8
          },
          professions: [
            {
              professionKey: "blacksmithing",
              name: "Blacksmithing",
              treasures: {
                completeCount: 0,
                incompleteCount: 0,
                unknownCount: 8,
                applicableTotal: 8
              },
              sources: []
            }
          ]
        }
      });

    expect(professionSetup.state).toBe("UNKNOWN");
    expect(attentionItem).toBeNull();
  });
});
