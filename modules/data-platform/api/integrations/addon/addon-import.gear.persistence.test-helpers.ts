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
};

export function createTransaction() {
  const characters = new Map<string, { id: string }>();
  const gearSlots = new Map<string, GearSlotRow>();
  let nextCharacterId = 1;

  const transaction = {
    character: {
      upsert: async (args: {
        where: { name_realm_region: { name: string; realm: string; region: string } };
      }) => {
        const key = JSON.stringify(args.where.name_realm_region);
        const existing = characters.get(key);

        if (existing) {
          return existing;
        }

        const created = { id: `char-${nextCharacterId++}` };
        characters.set(key, created);
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
    }
  };

  return { transaction, gearSlots };
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
    gemIds: []
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
    ...overrides
  };
}

export function snapshot(characters: AddonCharacter[]): AddonSnapshot {
  return {
    addonVersion: "0.1.0",
    schemaVersion: 1,
    client: { version: null, build: null, interfaceVersion: null },
    catalogs: [],
    recipeCatalogs: [],
    characterRecipeOperations: [],
    characters
  };
}
