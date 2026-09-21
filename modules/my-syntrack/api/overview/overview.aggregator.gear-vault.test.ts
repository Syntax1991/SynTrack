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
  /*
   * G1: the old data-driven "MANUAL_LOG" vault fallback
   * (resolveVaultOverviewState/OverviewVaultCharacterInput/
   * vaultByCharacterId) was removed as dead code - OverviewService always
   * fed it an empty map, so it could only ever resolve to this exact
   * UNKNOWN/0-slot shape. Vault has no addon-independent fallback at all
   * (see mythic-plus-vault-firewall.test.ts); the real, live vault state
   * comes exclusively from weeklyGameplayByCharacterId (addon-sourced).
   * Real 1/4/8 threshold-progress coverage for that live path already
   * exists at its own layer (weekly-gameplay.authority.test.ts).
   */
  it("no weeklyGameplay data for a character does NOT become Vault Complete - it is UNKNOWN, never READY", () => {
    const { characters } =
      aggregateCharacterWeeklyStates(
        baseInput()
      );

    expect(
      characters[0]!.vault.state
    ).toBe("UNKNOWN");

    expect(
      characters[0]!.vault.state
    ).not.toBe("READY");

    expect(
      characters[0]!.vault
    ).toMatchObject({
      unlockedSlots: 0,
      slotsTotal: 0,
      highestKeyLevel: null
    });
  });
});
