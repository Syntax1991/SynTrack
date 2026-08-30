import { describe, expect, it } from "vitest";
import { AddonCharacterPersistence } from "./addon-import.character.persistence.js";
import {
  character,
  createTransaction,
  emptySlot,
  equippedSlot,
  gearSnapshot,
  snapshot
} from "./addon-import.gear.persistence.test-helpers.js";

describe("AddonCharacterPersistence gear ownership and source semantics", () => {
  it("D: a manual-only character (no gear snapshot) is unaffected by an unrelated import", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    gearSlots.set("char-manual:HEAD", {
      characterId: "char-manual",
      slotKey: "HEAD",
      itemId: null,
      itemLink: null,
      itemName: "Hand-typed Helm",
      itemLevel: 600,
      quality: null,
      enchantStatus: "NOT_APPLICABLE",
      enchantName: null,
      enchantId: null,
      socketCount: 0,
      gemCount: 0,
      gemIds: null,
      notes: null,
      source: "MANUAL",
      lastSyncedAt: null as unknown as Date,
      setId: null,
      expansionId: null,
      setEvidenceResolved: null,
      setBonusResolved: null,
      setBonusSpellIds: null,
      uniqueCategoryId: null,
      uniqueCategoryCount: null,
      uniquenessResolved: null
    });

    await persistence.persist(
      transaction as never,
      snapshot([character(null, { name: "OtherCharacter" })]),
      new Map(),
      new Map()
    );

    const preserved = gearSlots.get("char-manual:HEAD");
    expect(preserved?.itemName).toBe("Hand-typed Helm");
    expect(preserved?.source).toBe("MANUAL");
  });

  it("F: a two-hand transition removes the stale off-hand only when confirmed empty", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("MAIN_HAND", { itemId: 1 }),
            equippedSlot("OFF_HAND", { itemId: 2 })
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    expect(gearSlots.size).toBe(2);

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("MAIN_HAND", { itemId: 999 }),
            emptySlot("OFF_HAND")
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    expect(gearSlots.size).toBe(1);
    expect([...gearSlots.values()][0]!.slotKey).toBe("MAIN_HAND");
  });

  it("addon ownership: a slot the payload never mentions at all is left untouched", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(gearSnapshot([equippedSlot("HEAD", { itemId: 5 })]))
      ]),
      new Map(),
      new Map()
    );

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([equippedSlot("MAIN_HAND", { itemId: 6 })])
        )
      ]),
      new Map(),
      new Map()
    );

    expect(gearSlots.size).toBe(2);
    expect([...gearSlots.values()].map((r) => r.slotKey).sort()).toEqual([
      "HEAD",
      "MAIN_HAND"
    ]);
  });

  it("uses source = ADDON and lastSyncedAt = the gear module's own capturedAt", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([equippedSlot("HEAD")], {
            capturedAt: "2026-08-27T19:34:31.000Z"
          })
        )
      ]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()][0]!;
    expect(row.source).toBe("ADDON");
    expect(row.lastSyncedAt.toISOString()).toBe("2026-08-27T19:34:31.000Z");
  });

  it("never persists a fabricated item name", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([character(gearSnapshot([equippedSlot("HEAD")]))]),
      new Map(),
      new Map()
    );

    expect([...gearSlots.values()][0]!.itemName).toBeNull();
  });
});
