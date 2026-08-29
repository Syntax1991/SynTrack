import { describe, expect, it } from "vitest";
import { aggregateCharacterWeeklyStates } from "./overview.aggregator.js";
import { baseInput } from "./overview.aggregator.fixtures.js";

describe("aggregateCharacterWeeklyStates - gear", () => {
  it("no gear rows does NOT become Gear Ready - it is NOT_TRACKED", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput()
      );

    expect(
      characters[0]!.gear.state
    ).toBe("NOT_TRACKED");

    expect(
      characters[0]!.gear
        .readinessPercent
    ).toBeNull();

    expect(
      characters[0]!.gear.itemLevel
    ).toBeNull();
  });

  it("surfaces the real averageItemLevel Gear already computes once at least one slot is tracked", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          gearByCharacterId: new Map([
            [
              "char-1",
              {
                id: "char-1",
                name: "Synblast",
                slots: [
                  {
                    item: {
                      itemLevel: 700
                    },
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
            ]
          ])
        })
      );

    expect(
      characters[0]!.gear.itemLevel
    ).toBe(700);
  });

  it("tracked gear with only missing enchants stays READY - enchants are not attention criteria", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
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
                readinessPercent: 0,
                averageItemLevel: null
              }
            ]
          ])
        })
      );

    expect(
      characters[0]!.gear.state
    ).toBe("READY");

    expect(
      characters[0]!.attentionItems
        .some(
          (item) =>
            item.domain === "gear"
        )
    ).toBe(false);
  });
});

describe("aggregateCharacterWeeklyStates - vault", () => {
  it("zero unlocked vault slots does NOT become Vault Complete - it is UNKNOWN, never READY", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          vaultByCharacterId:
            new Map([
              [
                "char-1",
                {
                  id: "char-1",
                  name: "Synblast",
                  runs: [],
                  vaultSlots: [
                    {
                      threshold: 1,
                      unlocked: false,
                      keyLevel: null
                    },
                    {
                      threshold: 4,
                      unlocked: false,
                      keyLevel: null
                    },
                    {
                      threshold: 8,
                      unlocked: false,
                      keyLevel: null
                    }
                  ],
                  highestKeyLevel:
                    null
                }
              ]
            ])
        })
      );

    expect(
      characters[0]!.vault.state
    ).toBe("UNKNOWN");

    expect(
      characters[0]!.vault.state
    ).not.toBe("READY");
  });

  it("real run data produces the correct existing 1/4/8 slot progress", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput({
          vaultByCharacterId:
            new Map([
              [
                "char-1",
                {
                  id: "char-1",
                  name: "Synblast",
                  runs: [
                    { keyLevel: 10 },
                    { keyLevel: 9 }
                  ],
                  vaultSlots: [
                    {
                      threshold: 1,
                      unlocked: true,
                      keyLevel: 10
                    },
                    {
                      threshold: 4,
                      unlocked: false,
                      keyLevel: null
                    },
                    {
                      threshold: 8,
                      unlocked: false,
                      keyLevel: null
                    }
                  ],
                  highestKeyLevel: 10
                }
              ]
            ])
        })
      );

    expect(
      characters[0]!.vault
        .unlockedSlots
    ).toBe(1);

    expect(
      characters[0]!.vault.slotsTotal
    ).toBe(3);

    expect(
      characters[0]!.vault.state
    ).toBe("IN_PROGRESS");
  });
});
