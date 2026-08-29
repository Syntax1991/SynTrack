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
                    missingEnchant: true,
                    missingGemCount: 0
                  }
                }
              ],
              trackedSlotCount: 1,
              issueCount: 1,
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

  it("prefers precise gear action over unresolved weekly placeholders", () => {
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
                    missingEnchant: true,
                    missingGemCount: 0
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

    expect(characters[0]!.nextAction?.domain).toBe("gear");
  });
});
