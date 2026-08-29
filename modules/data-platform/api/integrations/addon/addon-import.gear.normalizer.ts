import {
  asBoolean,
  asNumber,
  asString,
  asTable,
  numericValues,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import { parseItemLink } from "./addon-import.item-link.normalizer.js";
import type {
  AddonGearBagSetPiece,
  AddonGearSlot,
  AddonGearSnapshot
} from "./addon-import.gear.types.js";
import type { LuaValue } from "./addon-import.types.js";

export const gearSlotKeys = [
  "HEAD",
  "NECK",
  "SHOULDER",
  "BACK",
  "CHEST",
  "WRIST",
  "HANDS",
  "WAIST",
  "LEGS",
  "FEET",
  "FINGER_1",
  "FINGER_2",
  "TRINKET_1",
  "TRINKET_2",
  "MAIN_HAND",
  "OFF_HAND"
] as const;

const knownSlotKeys = new Set<string>(gearSlotKeys);

/*
 * Gear schemaVersion 2 adds tier-set / embellishment evidence fields.
 * Older v1 snapshots are ignored (return null) so stale rows are not
 * wiped and Overview stays UNKNOWN for tier/emb until a v2 capture.
 */
export const SUPPORTED_GEAR_SCHEMA_VERSION = 2;

function asOptionalBoolean(
  value: LuaValue | undefined
): boolean | null {
  if (value === true) {
    return true;
  }

  if (value === false) {
    return false;
  }

  return null;
}

function normalizeSpellIds(
  value: LuaValue | undefined
): number[] | null {
  const table = asTable(value);

  if (!table) {
    return null;
  }

  return numericValues(table)
    .map((entry) => asNumber(entry))
    .filter((id): id is number => id !== null);
}

function emptyEvidenceFields(): Pick<
  AddonGearSlot,
  | "expansionId"
  | "setId"
  | "setEvidenceResolved"
  | "setBonusResolved"
  | "setBonusSpellIds"
  | "uniqueCategoryId"
  | "uniqueCategoryCount"
  | "uniquenessResolved"
> {
  return {
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

function normalizeGearSlot(
  slotKey: string,
  value: LuaValue
): AddonGearSlot | null {
  const slot = asTable(value);

  if (!slot) {
    return null;
  }

  const equipped = asBoolean(slot.equipped);

  if (!equipped) {
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
      ...emptyEvidenceFields()
    };
  }

  const itemLink = asString(slot.itemLink);
  const parsedLink = parseItemLink(itemLink);
  const setBonusResolved = asOptionalBoolean(slot.setBonusResolved);
  const setBonusSpellIds =
    setBonusResolved === true
      ? (normalizeSpellIds(slot.setBonusSpellIds) ?? [])
      : normalizeSpellIds(slot.setBonusSpellIds);

  return {
    slotKey,
    equipped: true,
    itemId: asNumber(slot.itemId) ?? parsedLink.itemId,
    itemLink,
    itemLevel: asNumber(slot.itemLevel),
    quality: asNumber(slot.quality),
    socketCount: asNumber(slot.socketCount),
    enchantId: parsedLink.enchantId,
    gemIds: parsedLink.gemIds,
    expansionId: asNumber(slot.expansionId),
    setId: asNumber(slot.setId),
    setEvidenceResolved: asOptionalBoolean(slot.setEvidenceResolved),
    setBonusResolved,
    setBonusSpellIds,
    uniqueCategoryId: asNumber(slot.uniqueCategoryId),
    uniqueCategoryCount: asNumber(slot.uniqueCategoryCount),
    uniquenessResolved: asOptionalBoolean(slot.uniquenessResolved)
  };
}

/*
 * Returns null for a missing/absent gear module and for an unsupported
 * schemaVersion - absence must never be confused with "all slots empty".
 */
export function normalizeGearSnapshot(
  gearModule: LuaValue | undefined
): AddonGearSnapshot | null {
  const module = asTable(gearModule);

  if (!module) {
    return null;
  }

  const schemaVersion = asNumber(module.schemaVersion) ?? 0;

  if (schemaVersion !== SUPPORTED_GEAR_SCHEMA_VERSION) {
    return null;
  }

  const data = asTable(module.data);

  if (!data) {
    return null;
  }

  const slotsTable = asTable(data.slots);

  if (!slotsTable) {
    return null;
  }

  const slots: AddonGearSlot[] = [];

  for (const slotKey of Object.keys(slotsTable)) {
    if (!knownSlotKeys.has(slotKey)) {
      continue;
    }

    const normalized = normalizeGearSlot(
      slotKey,
      slotsTable[slotKey] as LuaValue
    );

    if (normalized) {
      slots.push(normalized);
    }
  }

  const bagSetPieces: AddonGearBagSetPiece[] = [];
  const bagTable = asTable(data.bagSetPieces);

  if (bagTable) {
    for (const key of Object.keys(bagTable)) {
      const piece = asTable(bagTable[key]);

      if (!piece) {
        continue;
      }

      bagSetPieces.push({
        itemId: asNumber(piece.itemId),
        itemLink: asString(piece.itemLink),
        setId: asNumber(piece.setId),
        expansionId: asNumber(piece.expansionId),
        equipLoc: asString(piece.equipLoc),
        setEvidenceResolved: asOptionalBoolean(
          piece.setEvidenceResolved
        )
      });
    }
  }

  return {
    schemaVersion,
    capturedAt: unixTimestampToIso(module.capturedAt),
    currentExpansionId: asNumber(data.currentExpansionId),
    slots,
    bagSetPieces
  };
}
