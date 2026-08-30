import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { baseInput } from "./overview.aggregator.fixtures.js";

/*
 * Overview must never surface generic Gear attention — not for enchants,
 * not for empty sockets. Factual counts remain on gear.* fields.
 */
describe("aggregateCharacterWeeklyStates - generic gear attention removed", () => {
  it("missing enchants do not produce Gear attention", () => {
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
                }
              ],
              trackedSlotCount: 1,
              issueCount: 1,
              readinessPercent: 0,
              averageItemLevel: 700
            }
          ]
        ])
      })
    );

    const character = characters[0]!;

    expect(character.gear.state).toBe("READY");
    expect(character.gear.missingEnchantCount).toBe(1);
    expect(
      character.attentionItems.some((item) => item.domain === "gear")
    ).toBe(false);
    expect(character.nextAction?.domain).not.toBe("gear");
  });

  it("empty sockets do not produce Gear attention or nextAction", () => {
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

    expect(character.gear.state).toBe("READY");
    expect(character.gear.emptySocketCount).toBe(2);
    expect(
      character.attentionItems.some((item) => item.domain === "gear")
    ).toBe(false);
    expect(character.nextAction?.domain).not.toBe("gear");
    expect(character.readinessState).not.toBe("attention");
  });
});
