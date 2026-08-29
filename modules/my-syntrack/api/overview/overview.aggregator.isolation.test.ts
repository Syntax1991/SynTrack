import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import {
  baseCharacter,
  baseInput,
  fullWeeklyCompletion
} from "./overview.aggregator.fixtures.js";

describe("aggregateCharacterWeeklyStates - cross-character isolation", () => {
  it("attention items stay associated with the correct character and never bleed between characters", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          characters: [
            baseCharacter({
              id: "char-1",
              name: "Synblast"
            }),
            baseCharacter({
              id: "char-2",
              name: "Synbloom"
            })
          ],
          weeklyByCharacterId:
            new Map([
              [
                "char-1",
                {
                  id: "char-1",
                  name: "Synblast",
                  completedTaskKeys:
                    fullWeeklyCompletion
                }
              ],
              [
                "char-2",
                {
                  id: "char-2",
                  name: "Synbloom",
                  completedTaskKeys:
                    fullWeeklyCompletion
                }
              ]
            ]),
          gearByCharacterId: new Map([
            [
              "char-1",
              {
                id: "char-1",
                name: "Synblast",
                slots: [
                  {
                    item: {
                      itemLevel: 600
                    },
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

    const synblast =
      characters.find(
        (state) =>
          state.character.id ===
          "char-1"
      );

    const synbloom =
      characters.find(
        (state) =>
          state.character.id ===
          "char-2"
      );

    expect(
      synblast?.attentionItems
    ).toHaveLength(1);

    expect(
      synblast?.attentionItems[0]
        ?.characterId
    ).toBe("char-1");

    expect(
      synbloom?.attentionItems
    ).toHaveLength(0);

    expect(
      synbloom?.gear.state
    ).toBe("NOT_TRACKED");
  });

  it("aggregation across multiple characters does not bleed weekly/vault state between characters", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          characters: [
            baseCharacter({
              id: "char-1",
              name: "Synblast"
            }),
            baseCharacter({
              id: "char-2",
              name: "Synbloom"
            })
          ],
          weeklyByCharacterId:
            new Map([
              [
                "char-1",
                {
                  id: "char-1",
                  name: "Synblast",
                  completedTaskKeys:
                    fullWeeklyCompletion
                }
              ]
            ])
        })
      );

    const synblast =
      characters.find(
        (state) =>
          state.character.id ===
          "char-1"
      );

    const synbloom =
      characters.find(
        (state) =>
          state.character.id ===
          "char-2"
      );

    expect(
      synblast?.weekly.completed
    ).toBe(5);

    expect(
      synbloom?.weekly.completed
    ).toBe(0);
  });

  it("a tracker value recorded for one character never appears on another character", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          characters: [
            baseCharacter({
              id: "char-1",
              name: "Synblast"
            }),
            baseCharacter({
              id: "char-2",
              name: "Synbloom"
            })
          ],
          trackerStatesByCharacterId:
            new Map([
              [
                "char-1",
                [
                  {
                    trackerDefinitionId:
                      "def-1",
                    characterId:
                      "char-1",
                    periodKey:
                      "ALWAYS",
                    state: "RECORDED",
                    source: "MANUAL",
                    value: {
                      valueType:
                        "BOOLEAN",
                      boolean: true
                    }
                  }
                ]
              ]
            ])
        })
      );

    const synblast =
      characters.find(
        (state) =>
          state.character.id ===
          "char-1"
      );

    const synbloom =
      characters.find(
        (state) =>
          state.character.id ===
          "char-2"
      );

    expect(
      synblast?.trackers
    ).toHaveLength(1);

    expect(
      synbloom?.trackers
    ).toHaveLength(0);
  });
});
