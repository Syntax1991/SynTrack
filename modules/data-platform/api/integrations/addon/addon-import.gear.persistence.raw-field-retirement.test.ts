import { describe, expect, it } from "vitest";
import { AddonCharacterPersistence } from "./addon-import.character.persistence.js";
import {
  character,
  createTransaction,
  equippedSlot,
  gearSnapshot,
  snapshot
} from "./addon-import.gear.persistence.test-helpers.js";

/*
 * Phase G3A (DB cleanup readiness, transition step): CharacterGearSlot
 * stops persisting itemLink/quality/enchantId/gemIds/uniqueCategoryCount
 * (G2 proved zero downstream consumer for any of the five). Split out of
 * addon-import.gear.persistence.test.ts to keep this specific,
 * newly-required coverage together and stay under the 350-line
 * architecture cap.
 */

function enrichedSlot() {
  return equippedSlot("HEAD", {
    // Realistic item link: item:itemId:enchantId:gem1:gem2:gem3:gem4
    itemLink: "item:271483:6807:213743:213743:0:0",
    itemId: 271483,
    itemLevel: 315,
    quality: 4,
    socketCount: 2,
    // Parsed-from-itemLink values a real normalizer run would produce -
    // these tests exercise the persistence layer directly (as
    // addon-import.gear.persistence.test.ts already does), so they are
    // supplied as already-normalized input, matching that file's pattern.
    enchantId: 6807,
    gemIds: [213743, 213743],
    setId: 2065,
    expansionId: 11,
    setEvidenceResolved: true,
    setBonusResolved: true,
    setBonusSpellIds: [1296629, 1296630],
    uniqueCategoryId: 42,
    uniqueCategoryCount: 2,
    uniquenessResolved: true
  });
}

describe("AddonGearPersistence - G3A raw-field retirement (new rows)", () => {
  it("does not persist itemLink/quality/enchantId/gemIds/uniqueCategoryCount for a brand-new row", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([character(gearSnapshot([enrichedSlot()]))]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()][0]!;

    expect(row.itemLink).toBeNull();
    expect(row.quality).toBeNull();
    expect(row.enchantId).toBeNull();
    expect(row.gemIds).toBeNull();
    expect(row.uniqueCategoryCount).toBeNull();
  });

  it("still derives and persists every live/derived fact from the same enriched slot", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([character(gearSnapshot([enrichedSlot()]))]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()][0]!;

    expect(row.itemId).toBe(271483);
    expect(row.itemLevel).toBe(315);
    expect(row.socketCount).toBe(2);
    // gemCount is derived from gemIds.length, independent of whether the
    // gemIds column itself is ever stored.
    expect(row.gemCount).toBe(2);
    expect(row.setId).toBe(2065);
    expect(row.expansionId).toBe(11);
    expect(row.setEvidenceResolved).toBe(true);
    expect(row.setBonusResolved).toBe(true);
    expect(row.setBonusSpellIds).toBe(JSON.stringify([1296629, 1296630]));
    expect(row.uniqueCategoryId).toBe(42);
    expect(row.uniquenessResolved).toBe(true);
  });

  it("derives enchantStatus READY from the in-memory parsed enchantId on an enchant-capable slot, without storing enchantId", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("WRIST", {
              itemLink: "item:1:6807::::",
              enchantId: 6807,
              gemIds: []
            })
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()][0]!;

    expect(row.enchantStatus).toBe("READY");
    expect(row.enchantId).toBeNull();
  });

  it("derives enchantStatus MISSING when the parsed enchantId is absent, on an enchant-capable slot", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("WRIST", {
              itemLink: "item:1",
              enchantId: null,
              gemIds: []
            })
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()][0]!;

    expect(row.enchantStatus).toBe("MISSING");
  });

  it("imports current addon payload shape (uniqueCategoryCount already absent) without error, preserving uniqueCategoryId/uniquenessResolved", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await expect(
      persistence.persist(
        transaction as never,
        snapshot([
          character(
            gearSnapshot([
              equippedSlot("HEAD", {
                uniqueCategoryId: 42,
                uniqueCategoryCount: null,
                uniquenessResolved: true
              })
            ])
          )
        ]),
        new Map(),
        new Map()
      )
    ).resolves.not.toThrow();

    const row = [...gearSlots.values()][0]!;

    expect(row.uniqueCategoryId).toBe(42);
    expect(row.uniqueCategoryCount).toBeNull();
    expect(row.uniquenessResolved).toBe(true);
  });

  it("imports an OLD enriched addon payload (still sending all five deprecated fields) without error", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await expect(
      persistence.persist(
        transaction as never,
        snapshot([character(gearSnapshot([enrichedSlot()]))]),
        new Map(),
        new Map()
      )
    ).resolves.not.toThrow();

    expect(gearSlots.size).toBe(1);
    // Old payload's five deprecated fields are accepted (no error), but
    // still never stored - see the "does not persist" test above.
  });
});

describe("AddonGearPersistence - G3A raw-field retirement (existing historical rows)", () => {
  it("leaves a row's pre-G3A historical deprecated values untouched while live fields update normally", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    // Seed a row exactly as it would look if written before G3A shipped -
    // real historical values present in all five now-deprecated columns.
    gearSlots.set("char-1:HEAD", {
      characterId: "char-1",
      slotKey: "HEAD",
      itemId: 100,
      itemLink: "item:100:1:2:3",
      itemName: null,
      itemLevel: 300,
      quality: 3,
      enchantStatus: "NOT_APPLICABLE",
      enchantName: null,
      enchantId: 1,
      socketCount: 1,
      gemCount: 2,
      gemIds: JSON.stringify([2, 3]),
      notes: null,
      source: "ADDON",
      lastSyncedAt: new Date("2026-01-01T00:00:00Z"),
      setId: 1000,
      expansionId: 9,
      setEvidenceResolved: true,
      setBonusResolved: false,
      setBonusSpellIds: null,
      uniqueCategoryId: null,
      uniqueCategoryCount: 5,
      uniquenessResolved: false
    });

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("HEAD", {
              itemId: 271483,
              itemLevel: 315,
              socketCount: 2,
              gemIds: [111, 222],
              setId: 2065,
              uniqueCategoryId: 42,
              uniqueCategoryCount: null,
              uniquenessResolved: true
            })
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()][0]!;

    // Live fields updated to the new import's values.
    expect(row.itemId).toBe(271483);
    expect(row.itemLevel).toBe(315);
    expect(row.gemCount).toBe(2);
    expect(row.setId).toBe(2065);
    expect(row.uniqueCategoryId).toBe(42);
    expect(row.uniquenessResolved).toBe(true);

    // The pre-G3A historical values in the five deprecated columns are
    // completely untouched - Prisma's update omits these keys entirely,
    // so the database never rewrites or clears them.
    expect(row.itemLink).toBe("item:100:1:2:3");
    expect(row.quality).toBe(3);
    expect(row.enchantId).toBe(1);
    expect(row.gemIds).toBe(JSON.stringify([2, 3]));
    expect(row.uniqueCategoryCount).toBe(5);
  });
});
