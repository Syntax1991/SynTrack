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

describe("AddonCharacterPersistence gear snapshot semantics", () => {
  it("A: a changed MAIN_HAND item replaces the previous one", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([equippedSlot("MAIN_HAND", { itemId: 111 })])
        )
      ]),
      new Map(),
      new Map()
    );

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([equippedSlot("MAIN_HAND", { itemId: 222 })])
        )
      ]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()].find((r) => r.slotKey === "MAIN_HAND");
    expect(row?.itemId).toBe(222);
    expect(gearSlots.size).toBe(1);
  });

  it("B: a slot explicitly reported empty is removed", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([character(gearSnapshot([equippedSlot("OFF_HAND")]))]),
      new Map(),
      new Map()
    );

    expect(gearSlots.size).toBe(1);

    await persistence.persist(
      transaction as never,
      snapshot([character(gearSnapshot([emptySlot("OFF_HAND")]))]),
      new Map(),
      new Map()
    );

    expect(gearSlots.size).toBe(0);
  });

  it("C: an equipped item with fully-null enrichment stays present, not dropped", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("TRINKET_1", {
              itemLevel: null,
              quality: null,
              socketCount: null
            })
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    expect(gearSlots.size).toBe(1);
    const row = [...gearSlots.values()][0]!;
    expect(row.itemId).toBe(1);
    expect(row.itemLevel).toBeNull();
    expect(row.quality).toBeNull();
    expect(row.socketCount).toBeNull();
  });

  it("E: ring and trinket slot pairs are independent", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("FINGER_1", { itemId: 10 }),
            emptySlot("FINGER_2"),
            equippedSlot("TRINKET_1", { itemId: 20 }),
            emptySlot("TRINKET_2")
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    expect(gearSlots.size).toBe(2);
    expect([...gearSlots.values()].map((r) => r.slotKey).sort()).toEqual([
      "FINGER_1",
      "TRINKET_1"
    ]);
  });

  it("persists schemaVersion 2 tier and embellishment evidence fields", async () => {
    const { transaction, gearSlots } = createTransaction();
    const persistence = new AddonCharacterPersistence();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(
          gearSnapshot([
            equippedSlot("HEAD", {
              setId: 5001,
              expansionId: 10,
              setEvidenceResolved: true,
              setBonusResolved: true,
              setBonusSpellIds: [111, 222],
              uniqueCategoryId: 42,
              uniqueCategoryCount: 2,
              uniquenessResolved: true
            })
          ])
        )
      ]),
      new Map(),
      new Map()
    );

    const row = [...gearSlots.values()][0]!;
    expect(row.setId).toBe(5001);
    expect(row.expansionId).toBe(10);
    expect(row.setEvidenceResolved).toBe(true);
    expect(row.setBonusResolved).toBe(true);
    expect(row.setBonusSpellIds).toBe(JSON.stringify([111, 222]));
    expect(row.uniqueCategoryId).toBe(42);
    expect(row.uniqueCategoryCount).toBe(2);
    expect(row.uniquenessResolved).toBe(true);
  });
});
