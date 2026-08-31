import { describe, expect, it } from "vitest";
import { RemovedCharacterRepository } from "../../../../my-syntrack/api/characters/removed-character.repository.js";
import { AddonCharacterPersistence } from "./addon-import.character.persistence.js";
import {
  character,
  createTransaction,
  equippedSlot,
  gearSnapshot,
  snapshot
} from "./addon-import.gear.persistence.test-helpers.js";

type RemovedRow = {
  id: string;
  raiderAccountId: string;
  stableCharacterKey: string;
  battleNetId: string | null;
};

function createTransactionWithRemovals() {
  const base = createTransaction();
  const removedRows: RemovedRow[] = [];
  let nextRemovedId = 1;

  const transaction = {
    ...base.transaction,
    removedCharacter: {
      findFirst: async (args: {
        where: {
          raiderAccountId: string;
          OR: Array<
            | { stableCharacterKey: { in: string[] } }
            | { battleNetId: string }
          >;
        };
        select?: { id: true };
      }) => {
        const match = removedRows.find((row) => {
          if (row.raiderAccountId !== args.where.raiderAccountId) {
            return false;
          }

          return args.where.OR.some((clause) => {
            if ("stableCharacterKey" in clause) {
              return clause.stableCharacterKey.in.includes(
                row.stableCharacterKey
              );
            }

            return row.battleNetId === clause.battleNetId;
          });
        });

        return match ? { id: match.id } : null;
      },
      upsert: async (args: {
        where: {
          raiderAccountId_stableCharacterKey: {
            raiderAccountId: string;
            stableCharacterKey: string;
          };
        };
        create: {
          raiderAccountId: string;
          stableCharacterKey: string;
          characterName: string;
          realmName: string;
          region: string;
          battleNetId: string | null;
        };
        update: Record<string, unknown>;
      }) => {
        const key = args.where.raiderAccountId_stableCharacterKey;
        const existing = removedRows.find(
          (row) =>
            row.raiderAccountId === key.raiderAccountId &&
            row.stableCharacterKey === key.stableCharacterKey
        );

        if (existing) {
          return existing;
        }

        const created: RemovedRow = {
          id: `removed-${nextRemovedId++}`,
          raiderAccountId: args.create.raiderAccountId,
          stableCharacterKey: args.create.stableCharacterKey,
          battleNetId: args.create.battleNetId
        };
        removedRows.push(created);
        return created;
      }
    }
  };

  return { ...base, transaction, removedRows };
}

describe("AddonCharacterPersistence character removal suppression", () => {
  it("skips a suppressed character when ownerRaiderAccountId is set", async () => {
    const { transaction, characters } = createTransactionWithRemovals();
    const persistence = new AddonCharacterPersistence();
    const removedRepo = new RemovedCharacterRepository();
    const owner = { ownerRaiderAccountId: "account-a" };

    await removedRepo.upsertSuppression(
      "account-a",
      { name: "Synblast", realm: "Antonidas", region: "eu" },
      transaction as never
    );

    const result = await persistence.persist(
      transaction as never,
      snapshot([
        character(gearSnapshot([equippedSlot("HEAD")]), {
          key: "eu:antonidas:synblast",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu"
        })
      ]),
      new Map(),
      new Map(),
      owner
    );

    expect(result.characters).toBe(0);
    expect(characters.size).toBe(0);
  });

  it("still persists other characters in the same snapshot", async () => {
    const { transaction, characters } = createTransactionWithRemovals();
    const persistence = new AddonCharacterPersistence();
    const removedRepo = new RemovedCharacterRepository();
    const owner = { ownerRaiderAccountId: "account-a" };

    await removedRepo.upsertSuppression(
      "account-a",
      { name: "Synblast", realm: "Antonidas", region: "eu" },
      transaction as never
    );

    const result = await persistence.persist(
      transaction as never,
      snapshot([
        character(gearSnapshot([equippedSlot("HEAD")]), {
          key: "eu:antonidas:synblast",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu"
        }),
        character(gearSnapshot([equippedSlot("HEAD", { itemId: 2 })]), {
          key: "eu:antonidas:synbloom",
          name: "Synbloom",
          realm: "Antonidas",
          region: "eu"
        })
      ]),
      new Map(),
      new Map(),
      owner
    );

    expect(result.characters).toBe(1);
    expect(characters.size).toBe(1);
    expect(
      [...characters.keys()].some((key) => key.includes("Synbloom"))
    ).toBe(true);
  });

  it("without ownerRaiderAccountId, does not apply another account's suppression", async () => {
    /*
     * Suppression is account-scoped and only consulted when an owner is
     * known. Anonymous / unowned persist must not inherit Account A's
     * RemovedCharacter rows.
     */
    const { transaction, characters } = createTransactionWithRemovals();
    const persistence = new AddonCharacterPersistence();
    const removedRepo = new RemovedCharacterRepository();

    await removedRepo.upsertSuppression(
      "account-a",
      { name: "Synblast", realm: "Antonidas", region: "eu" },
      transaction as never
    );

    const result = await persistence.persist(
      transaction as never,
      snapshot([
        character(gearSnapshot([equippedSlot("HEAD")]), {
          key: "eu:antonidas:synblast",
          name: "Synblast",
          realm: "Antonidas",
          region: "eu"
        })
      ]),
      new Map(),
      new Map(),
      {}
    );

    expect(result.characters).toBe(1);
    expect(characters.size).toBe(1);
  });
});
