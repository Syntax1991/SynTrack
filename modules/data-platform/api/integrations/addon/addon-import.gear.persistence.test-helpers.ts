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

export { createTransaction } from "./addon-import.gear.persistence.test-transaction.js";

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
    weekliesSignals: null,
    seasonEvidence: null,
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
