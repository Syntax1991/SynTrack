import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import {
  baseCharacter,
  baseInput,
  fullWeeklyCompletion
} from "./overview.aggregator.fixtures.js";

const readyWeekly = {
  completeCount: 2,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 2
};

const zeroAggregate = {
  completeCount: 0,
  incompleteCount: 0,
  unknownCount: 0,
  applicableTotal: 0
};

/*
 * Domain separation: Knowledge Treasures are permanent and must never
 * mutate Weekly Quest / Treatise / Drops aggregates or invent weekly
 * attention from treasure incompleteness alone.
 */
describe("aggregateCharacterWeeklyStates - knowledge treasure separation", () => {
  it("keeps Quest/Treatise/Drops unchanged when treasures are incomplete", () => {
    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        characters: [baseCharacter()],
        weeklyByCharacterId: new Map([
          [
            "char-1",
            {
              id: "char-1",
              name: "Synblast",
              completedTaskKeys: fullWeeklyCompletion
            }
          ]
        ]),
        professionWeeklyByCharacterId: new Map([
          [
            "char-1",
            {
              id: "char-1",
              name: "Synblast",
              quest: readyWeekly,
              treatise: readyWeekly,
              drops: readyWeekly,
              professions: []
            }
          ]
        ]),
        professionKnowledgeTreasureByCharacterId: new Map([
          [
            "char-1",
            {
              id: "char-1",
              name: "Synblast",
              treasures: {
                completeCount: 7,
                incompleteCount: 1,
                unknownCount: 0,
                applicableTotal: 8
              },
              professions: [
                {
                  professionKey: "alchemy",
                  name: "Alchemy",
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
            }
          ]
        ])
      })
    );

    const character = characters[0]!;

    expect(character.professionWeekly.quest).toEqual(readyWeekly);
    expect(character.professionWeekly.treatise).toEqual(readyWeekly);
    expect(character.professionWeekly.drops).toEqual(readyWeekly);
    expect(character.professionWeekly.state).toBe("READY");

    expect(character.professionKnowledgeTreasures.state).toBe(
      "ATTENTION"
    );
    expect(
      character.attentionItems.some(
        (item) => item.domain === "profession-knowledge-treasure"
      )
    ).toBe(true);
    expect(
      character.attentionItems.some(
        (item) => item.domain === "profession-weekly"
      )
    ).toBe(false);
  });

  it("does not invent treasure attention when applicableTotal is zero", () => {
    const { characters } = aggregateCharacterWeeklyStates(
      baseInput({
        professionKnowledgeTreasureByCharacterId: new Map([
          [
            "char-1",
            {
              id: "char-1",
              name: "Synblast",
              treasures: zeroAggregate,
              professions: []
            }
          ]
        ])
      })
    );

    expect(
      characters[0]!.professionKnowledgeTreasures.state
    ).toBe("NOT_TRACKED");
    expect(
      characters[0]!.attentionItems.some(
        (item) => item.domain === "profession-knowledge-treasure"
      )
    ).toBe(false);
  });
});
