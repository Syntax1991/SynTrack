import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { baseInput } from "./overview.aggregator.fixtures.js";

/*
 * Missing enchants must not drive Gear attention / Overview Action /
 * character readiness. Raw enchant capture remains elsewhere.
 */
describe("aggregateCharacterWeeklyStates - enchant attention removed", () => {
  it("fresh gear with missing enchants does not produce Gear attention", () => {
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
                  item: { itemLevel: 700 },
                  issues: {
                    missingEnchant: true,
                    missingGemCount: 0
                  }
                },
                {
                  item: { itemLevel: 698 },
                  issues: {
                    missingEnchant: true,
                    missingGemCount: 0
                  }
                }
              ],
              trackedSlotCount: 2,
              issueCount: 2,
              readinessPercent: 0,
              averageItemLevel: 699
            }
          ]
        ])
      })
    );

    const character = characters[0]!;

    expect(character.gear.state).toBe("READY");
    expect(character.gear.missingEnchantCount).toBe(2);
    expect(
      character.attentionItems.some(
        (item) => item.domain === "gear"
      )
    ).toBe(false);
    expect(character.nextAction?.domain).not.toBe("gear");
    expect(character.readinessState).not.toBe("attention");
  });

  it("empty sockets still produce Gear attention without mentioning enchants", () => {
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
                  item: { itemLevel: 700 },
                  issues: {
                    missingEnchant: true,
                    missingGemCount: 2
                  }
                }
              ],
              trackedSlotCount: 1,
              issueCount: 3,
              readinessPercent: 0,
              averageItemLevel: 700
            }
          ]
        ])
      })
    );

    const character = characters[0]!;

    expect(character.gear.state).toBe("ATTENTION");
    expect(character.gear.emptySocketCount).toBe(2);
    expect(character.nextAction?.domain).toBe("gear");
    expect(character.nextAction?.detail).toContain("socket");
    expect(character.nextAction?.detail).not.toMatch(/enchant/i);
  });
});
