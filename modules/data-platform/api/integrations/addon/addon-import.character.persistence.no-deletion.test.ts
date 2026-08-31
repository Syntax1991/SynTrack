import { describe, expect, it } from "vitest";
import { AddonCharacterPersistence } from "./addon-import.character.persistence.js";
import {
  character,
  createTransaction,
  equippedSlot,
  gearSnapshot,
  snapshot
} from "./addon-import.gear.persistence.test-helpers.js";

function ownedRoster(count: number) {
  return Array.from({ length: count }, (_, index) =>
    character(gearSnapshot([equippedSlot("HEAD")]), {
      key: `eu:antonidas:char${index}`,
      name: `Char${index}`,
      realm: "Antonidas",
      region: "eu"
    })
  );
}

describe("AddonCharacterPersistence empty capture must not delete roster", () => {
  it("A/B: 22 owned characters stay 22 after a later empty snapshot", async () => {
    const { transaction, characters } = createTransaction();
    const persistence = new AddonCharacterPersistence();
    const owner = { ownerRaiderAccountId: "account-a" };

    await persistence.persist(
      transaction as never,
      snapshot(ownedRoster(22)),
      new Map(),
      new Map(),
      owner
    );

    expect(characters.size).toBe(22);
    expect(
      [...characters.values()].every(
        (row) => row.raiderAccountId === "account-a"
      )
    ).toBe(true);

    await persistence.persist(
      transaction as never,
      snapshot([]),
      new Map(),
      new Map(),
      owner
    );

    expect(characters.size).toBe(22);
    expect(
      [...characters.values()].every(
        (row) => row.raiderAccountId === "account-a"
      )
    ).toBe(true);
  });

  it("C/D: logout/abstention (no current character) preserves rows and ownership", async () => {
    const { transaction, characters } = createTransaction();
    const persistence = new AddonCharacterPersistence();
    const owner = { ownerRaiderAccountId: "account-a" };

    await persistence.persist(
      transaction as never,
      snapshot(ownedRoster(22)),
      new Map(),
      new Map(),
      owner
    );

    await persistence.persist(
      transaction as never,
      snapshot([]),
      new Map(),
      new Map(),
      owner
    );

    expect(characters.size).toBe(22);
    expect(
      [...characters.values()].every(
        (row) => row.raiderAccountId === "account-a"
      )
    ).toBe(true);
  });

  it("E: a later valid capture updates one character and leaves the others", async () => {
    const { transaction, characters } = createTransaction();
    const persistence = new AddonCharacterPersistence();
    const owner = { ownerRaiderAccountId: "account-a" };

    await persistence.persist(
      transaction as never,
      snapshot(ownedRoster(22)),
      new Map(),
      new Map(),
      owner
    );

    const idsBefore = [...characters.values()].map((row) => row.id).sort();

    await persistence.persist(
      transaction as never,
      snapshot([
        character(gearSnapshot([equippedSlot("HEAD", { itemId: 999 })]), {
          key: "eu:antonidas:char0",
          name: "Char0",
          realm: "Antonidas",
          region: "eu"
        })
      ]),
      new Map(),
      new Map(),
      owner
    );

    expect(characters.size).toBe(22);
    const idsAfter = [...characters.values()].map((row) => row.id).sort();
    expect(idsAfter).toEqual(idsBefore);
    expect(
      [...characters.values()].every(
        (row) => row.raiderAccountId === "account-a"
      )
    ).toBe(true);
  });
});
