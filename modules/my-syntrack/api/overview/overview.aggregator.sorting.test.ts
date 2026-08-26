import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import {
  baseCharacter,
  baseInput,
  fullWeeklyCompletion
} from "./overview.aggregator.fixtures.js";

describe("aggregateCharacterWeeklyStates - sorting and readiness semantics", () => {
  it("sorts characters needing attention before ready characters", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
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
          weeklyByCharacterId:
            new Map([
              [
                "ready-char",
                {
                  id: "ready-char",
                  name: "Synbloom",
                  completedTaskKeys:
                    fullWeeklyCompletion
                }
              ],
              [
                "attention-char",
                {
                  id: "attention-char",
                  name: "Synblast",
                  completedTaskKeys:
                    []
                }
              ]
            ])
        })
      );

    expect(
      characters.map(
        (state) => state.character.id
      )
    ).toEqual([
      "attention-char",
      "ready-char"
    ]);
  });

  it("treats unknown as distinct from ready - an all-untracked character is unknown, not ready", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          weeklyTaskCount: 0
        })
      );

    expect(
      characters[0]!.readinessState
    ).toBe("unknown");

    expect(
      characters[0]!.readinessState
    ).not.toBe("ready");
  });

  it("computes a deterministic next action using severity priority, never a hardcoded UI decision tree", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          weeklyByCharacterId:
            new Map([
              [
                "char-1",
                {
                  id: "char-1",
                  name: "Synblast",
                  completedTaskKeys:
                    []
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
                      missingEnchant: true,
                      missingGemCount: 0
                    }
                  }
                ],
                trackedSlotCount: 1,
                issueCount: 1,
                readinessPercent: 0
              }
            ]
          ])
        })
      );

    expect(
      characters[0]!.nextAction
        ?.domain
    ).toBe("weekly");
  });
});
