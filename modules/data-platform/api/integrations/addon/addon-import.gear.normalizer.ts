import {
  asBoolean,
  asNumber,
  asString,
  asTable,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import { parseItemLink } from "./addon-import.item-link.normalizer.js";
import type {
  AddonGearSlot,
  AddonGearSnapshot,
  LuaValue
} from "./addon-import.types.js";

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

const knownSlotKeys = new Set<string>(
  gearSlotKeys
);

/*
 * The current supported Gear module contract version - a future,
 * higher schemaVersion is ignored entirely (see
 * normalizeGearSnapshot) rather than risk misinterpreting an unknown
 * payload shape as today's shape.
 */
export const SUPPORTED_GEAR_SCHEMA_VERSION = 1;

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
      gemIds: []
    };
  }

  const itemLink = asString(slot.itemLink);
  const parsedLink = parseItemLink(itemLink);

  return {
    slotKey,
    equipped: true,
    itemId: asNumber(slot.itemId) ?? parsedLink.itemId,
    itemLink,
    itemLevel: asNumber(slot.itemLevel),
    quality: asNumber(slot.quality),
    socketCount: asNumber(slot.socketCount),
    enchantId: parsedLink.enchantId,
    gemIds: parsedLink.gemIds
  };
}

/*
 * Returns null for a missing/absent gear module (character never ran
 * the Gear capture, e.g. an older client version) and also for a
 * reported schemaVersion this importer doesn't understand yet -
 * either way, absence of a usable snapshot must never be confused with
 * "confirmed all slots empty".
 */
export function normalizeGearSnapshot(
  gearModule: LuaValue | undefined
): AddonGearSnapshot | null {
  const module = asTable(gearModule);

  if (!module) {
    return null;
  }

  const schemaVersion =
    asNumber(module.schemaVersion) ?? 0;

  if (
    schemaVersion !==
    SUPPORTED_GEAR_SCHEMA_VERSION
  ) {
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

  return {
    schemaVersion,
    capturedAt: unixTimestampToIso(module.capturedAt),
    slots
  };
}
