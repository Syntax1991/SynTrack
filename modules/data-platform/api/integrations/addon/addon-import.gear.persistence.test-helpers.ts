import type {
  AddonCharacter,
  AddonGearSnapshot,
  AddonSnapshot
} from "./addon-import.types.js";

export type GearSlotRow = {
  characterId: string;
  slotKey: string;
  itemId: number | null;
  itemLink: string | null;
  itemName: string | null;
  itemLevel: number | null;
  quality: number | null;
  enchantStatus: string;
  enchantName: string | null;
  enchantId: number | null;
  socketCount: number | null;
  gemCount: number;
  gemIds: string | null;
  notes: string | null;
  source: string;
  lastSyncedAt: Date;
  setId: number | null;
  expansionId: number | null;
  setEvidenceResolved: boolean | null;
  setBonusResolved: boolean | null;
  setBonusSpellIds: string | null;
  uniqueCategoryId: number | null;
  uniqueCategoryCount: number | null;
  uniquenessResolved: boolean | null;
};

export type BagSetPieceRow = {
  characterId: string;
  itemId: number | null;
  itemLink: string | null;
  setId: number | null;
  expansionId: number | null;
  equipLoc: string | null;
  setEvidenceResolved: boolean | null;
  lastSyncedAt: Date | null;
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
        create: GearSlotRow;
        update: Omit<GearSlotRow, "characterId" | "slotKey">;
      }) => {
        const { characterId, slotKey } = args.where.characterId_slotKey;
        const key = `${characterId}:${slotKey}`;
        const existing = gearSlots.get(key);

        const row: GearSlotRow = existing
          ? { ...existing, ...args.update }
          : { ...args.create };

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

export function emptySlot(slotKey: string) {
  return {
    slotKey,
    equipped: false,
    itemId: null,
    itemLink: null,
    itemLevel: null,
    quality: null,
    socketCount: null,
    enchantId: null,
    gemIds: [],
    expansionId: null,
    setId: null,
    setEvidenceResolved: null,
    setBonusResolved: null,
    setBonusSpellIds: null,
    uniqueCategoryId: null,
    uniqueCategoryCount: null,
    uniquenessResolved: null
  };
}

export function equippedSlot(
  slotKey: string,
  overrides: Partial<AddonGearSnapshot["slots"][number]> = {}
) {
  return {
    slotKey,
    equipped: true,
    itemId: 1,
    itemLink: "item:1",
    itemLevel: 675,
    quality: 4,
    socketCount: 0,
    enchantId: null,
    gemIds: [],
    expansionId: null,
    setId: null,
    setEvidenceResolved: null,
    setBonusResolved: null,
    setBonusSpellIds: null,
    uniqueCategoryId: null,
    uniqueCategoryCount: null,
    uniquenessResolved: null,
    ...overrides
  };
}

export function character(
  gear: AddonGearSnapshot | null,
  overrides: Partial<AddonCharacter> = {}
): AddonCharacter {
  return {
    key: "eu:antonidas:synblast",
    name: "Synblast",
    realm: "Antonidas",
    region: "eu",
    className: "Shaman",
    level: 90,
    snapshotReason: "test",
    lastUpdatedAt: "2026-08-27T19:34:31.000Z",
    professions: [],
    gear,
    resources: null,
    professionWeekly: null,
    professionKnowledgeTreasures: null,
    weeklyActivity: null,
    ...overrides
  };
}

export function snapshot(characters: AddonCharacter[]): AddonSnapshot {
  return {
    addonVersion: "0.2.0",
    schemaVersion: 1,
    client: { version: null, build: null, interfaceVersion: null },
    catalogs: [],
    recipeCatalogs: [],
    characterRecipeOperations: [],
    characters
  };
}

export function gearSnapshot(
  slots: AddonGearSnapshot["slots"],
  overrides: Partial<AddonGearSnapshot> = {}
): AddonGearSnapshot {
  return {
    schemaVersion: 2,
    capturedAt: null,
    currentExpansionId: 10,
    slots,
    bagSetPieces: [],
    ...overrides
  };
}
