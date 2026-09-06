import type { GearSlotRow, BagSetPieceRow } from "./addon-import.gear.persistence.test-helpers.js";

/*
 * Split out of addon-import.gear.persistence.test-helpers.ts (G3A) to
 * stay under the 350-line architecture cap - the fake in-memory
 * transaction itself, used by every gear persistence test.
 */

/*
 * Every CharacterGearSlot column that is nullable with no @default in
 * the real Prisma schema - a real `create` omitting one of these stores
 * NULL, never `undefined`. Kept in sync with schema.prisma's
 * CharacterGearSlot model.
 */
const nullableColumnDefaults: Pick<
  GearSlotRow,
  | "itemId"
  | "itemLink"
  | "itemName"
  | "itemLevel"
  | "quality"
  | "enchantName"
  | "enchantId"
  | "socketCount"
  | "gemIds"
  | "notes"
  | "setId"
  | "expansionId"
  | "setEvidenceResolved"
  | "setBonusResolved"
  | "setBonusSpellIds"
  | "uniqueCategoryId"
  | "uniqueCategoryCount"
  | "uniquenessResolved"
> = {
  itemId: null,
  itemLink: null,
  itemName: null,
  itemLevel: null,
  quality: null,
  enchantName: null,
  enchantId: null,
  socketCount: null,
  gemIds: null,
  notes: null,
  setId: null,
  expansionId: null,
  setEvidenceResolved: null,
  setBonusResolved: null,
  setBonusSpellIds: null,
  uniqueCategoryId: null,
  uniqueCategoryCount: null,
  uniquenessResolved: null
};

export function createTransaction() {
  const characters = new Map<
    string,
    { id: string; raiderAccountId: string | null }
  >();
  const charactersById = new Map<
    string,
    { id: string; raiderAccountId: string | null }
  >();
  const gearSlots = new Map<string, GearSlotRow>();
  const bagPieces = new Map<string, BagSetPieceRow>();
  let nextCharacterId = 1;

  const identityKey = (identity: {
    name: string;
    realm: string;
    region: string;
  }) => JSON.stringify(identity);

  const transaction = {
    removedCharacter: {
      findFirst: async () => null
    },
    character: {
      findUnique: async (args: {
        where: {
          name_realm_region: {
            name: string;
            realm: string;
            region: string;
          };
        };
      }) => {
        return (
          characters.get(
            identityKey(args.where.name_realm_region)
          ) ?? null
        );
      },
      update: async (args: {
        where: { id: string };
        data: { raiderAccountId?: string | null };
      }) => {
        const existing = charactersById.get(args.where.id);

        if (!existing) {
          throw new Error(
            `character ${args.where.id} not found`
          );
        }

        if ("raiderAccountId" in args.data) {
          existing.raiderAccountId =
            args.data.raiderAccountId ?? null;
        }

        return existing;
      },
      create: async (args: {
        data: {
          name: string;
          realm: string;
          region: string;
          raiderAccountId?: string | null;
        };
      }) => {
        const created = {
          id: `char-${nextCharacterId++}`,
          raiderAccountId: args.data.raiderAccountId ?? null
        };
        characters.set(
          identityKey({
            name: args.data.name,
            realm: args.data.realm,
            region: args.data.region
          }),
          created
        );
        charactersById.set(created.id, created);
        return created;
      }
    },
    characterProfession: {
      upsert: async () => ({ id: "profession-assignment" })
    },
    characterProfessionNodeProgress: {
      deleteMany: async () => ({ count: 0 }),
      upsert: async () => ({})
    },
    characterGearSlot: {
      deleteMany: async (args: {
        where: { characterId: string; source: string; slotKey: { in: string[] } };
      }) => {
        let count = 0;

        for (const [key, row] of gearSlots) {
          if (
            row.characterId === args.where.characterId &&
            row.source === args.where.source &&
            args.where.slotKey.in.includes(row.slotKey)
          ) {
            gearSlots.delete(key);
            count += 1;
          }
        }

        return { count };
      },
      upsert: async (args: {
        where: { characterId_slotKey: { characterId: string; slotKey: string } };
        create: Partial<GearSlotRow> &
          Pick<
            GearSlotRow,
            | "characterId"
            | "slotKey"
            | "enchantStatus"
            | "gemCount"
            | "source"
            | "lastSyncedAt"
          >;
        update: Partial<Omit<GearSlotRow, "characterId" | "slotKey">>;
      }) => {
        const { characterId, slotKey } = args.where.characterId_slotKey;
        const key = `${characterId}:${slotKey}`;
        const existing = gearSlots.get(key);

        /*
         * Mirrors real Prisma/SQLite semantics for a nullable column with
         * no @default: a `create` call that omits the key stores NULL
         * (never `undefined`); an `update` call that omits the key leaves
         * the existing stored value completely untouched (G3A relies on
         * exactly this for historical-row preservation).
         */
        const row: GearSlotRow = existing
          ? { ...existing, ...args.update }
          : { ...nullableColumnDefaults, ...args.create };

        gearSlots.set(key, row);
        return row;
      }
    },
    characterGearBagSetPiece: {
      deleteMany: async (args: {
        where: { characterId: string };
      }) => {
        let count = 0;

        for (const [key, row] of bagPieces) {
          if (row.characterId === args.where.characterId) {
            bagPieces.delete(key);
            count += 1;
          }
        }

        return { count };
      },
      createMany: async (args: {
        data: BagSetPieceRow[];
      }) => {
        for (const row of args.data) {
          const key = `${row.characterId}:${row.itemId ?? "x"}:${bagPieces.size}`;
          bagPieces.set(key, row);
        }

        return { count: args.data.length };
      }
    }
  };

  return { transaction, characters, gearSlots, bagPieces };
}
