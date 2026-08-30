import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import {
  baseCharacter,
  baseInput
} from "./overview.aggregator.fixtures.js";

describe("aggregateCharacterWeeklyStates - sorting and readiness semantics", () => {
  it("sorts characters needing attention before ready characters", () => {
    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        characters: [
          baseCharacter({
            id: "ready-char",
            name: "Synbloom"
          }),
          baseCharacter({
            id: "attention-char",
            name: "Synblast"
          })
        ],
        professionByCharacterId: new Map([
          [
            "attention-char",
            {
              id: "attention-char",
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
                }
              ]
            }
          ]
        ]),
        professionKnowledgeTreasureByCharacterId: new Map([
          [
            "attention-char",
            {
              id: "attention-char",
              name: "Synblast",
              treasures: {
                completeCount: 0,
                incompleteCount: 1,
                unknownCount: 0,
                applicableTotal: 1
              },
              professions: [
                {
                  professionKey: "alchemy",
                  name: "Alchemy",
                  treasures: {
                    completeCount: 0,
                    incompleteCount: 1,
                    unknownCount: 0,
                    applicableTotal: 1
                  },
                  sources: [
                    {
                      sourceKey: "treasure-1",
                      name: "Treasure 1",
                      state: "INCOMPLETE",
                      capturedAt: null
                    }
                  ]
                }
              ]
            }
          ]
        ]),
        gearByCharacterId: new Map([
          [
            "ready-char",
            {
              id: "ready-char",
              name: "Synbloom",
              slots: [
                {
                  item: { itemLevel: 700 },
                  issues: {
                    missingEnchant: false,
                    missingGemCount: 0
                  }
                }
              ],
              trackedSlotCount: 1,
              issueCount: 0,
              readinessPercent: 100,
              averageItemLevel: 700
            }
          ],
          [
            "attention-char",
            {
              id: "attention-char",
              name: "Synblast",
              slots: [
                {
                  item: { itemLevel: 600 },
                  issues: {
                    missingEnchant: false,
                    missingGemCount: 3
                  }
                }
              ],
              trackedSlotCount: 1,
              issueCount: 3,
              readinessPercent: 0,
              averageItemLevel: 600
            }
          ]
        ])
      })
    );

    expect(characters.map((state) => state.character.id)).toEqual([
      "attention-char",
      "ready-char"
    ]);
  });

  it("treats unknown as distinct from ready - an all-untracked character is unknown, not ready", () => {
    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        weeklyTaskCount: 0
      })
    );

    expect(characters[0]!.readinessState).toBe("unknown");
    expect(characters[0]!.readinessState).not.toBe("ready");
  });

  it("does not promote empty sockets to gear nextAction", () => {
    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        gearByCharacterId: new Map([
          [
            "char-1",
            {
              id: "char-1",
              name: "Synblast",
              slots: [
                {
                  item: { itemLevel: 600 },
                  issues: {
                    missingEnchant: false,
                    missingGemCount: 1
                  }
                }
              ],
              trackedSlotCount: 1,
              issueCount: 1,
              readinessPercent: 0,
              averageItemLevel: null
            }
          ]
        ])
      })
    );

    expect(characters[0]!.nextAction?.domain).not.toBe("gear");
    expect(characters[0]!.gear.emptySocketCount).toBe(1);
  });
});
