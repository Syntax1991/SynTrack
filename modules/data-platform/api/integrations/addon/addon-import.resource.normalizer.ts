import {
  asBoolean,
  asNumber,
  asTable,
  numericValues,
  unixTimestampToIso
} from "./addon-import.lua-utils.js";
import type {
  AddonCurrencyEntry,
  AddonItemResourceEntry,
  AddonResourceSnapshot,
  LuaValue
} from "./addon-import.types.js";

/*
 * The current supported Resources module contract version - mirrors the
 * Gear module's own versioning discipline (see
 * addon-import.gear.normalizer.ts). A reported schemaVersion this
 * importer doesn't understand is ignored entirely rather than risk
 * misinterpreting an unknown payload shape as today's shape.
 */
export const SUPPORTED_RESOURCE_SCHEMA_VERSION = 1;

/*
 * asBoolean() collapses "false" and "absent" into the same `false` -
 * correct for Gear's `equipped` flag, but wrong here: a currency's
 * isCapped/isWeeklyCapped/discovered/accountWide fields must stay
 * nullable (Blizzard reporting `false` is real evidence; the addon never
 * having set the field at all is not). This preserves that distinction.
 */
function asNullableBoolean(
  value: LuaValue | undefined
): boolean | null {
  return typeof value === "boolean"
    ? value
    : null;
}

function normalizeCurrencyEntry(
  value: LuaValue
): AddonCurrencyEntry | null {
  const row = asTable(value);

  if (!row) {
    return null;
  }

  const currencyId = asNumber(row.currencyId);

  if (currencyId === null || currencyId <= 0) {
    return null;
  }

  return {
    currencyId,
    quantity: asNumber(row.quantity),
    maxQuantity: asNumber(row.maxQuantity),
    weeklyQuantity: asNumber(row.weeklyQuantity),
    maxWeeklyQuantity: asNumber(row.maxWeeklyQuantity),
    isCapped: asNullableBoolean(row.isCapped),
    isWeeklyCapped: asNullableBoolean(row.isWeeklyCapped),
    discovered: asNullableBoolean(row.discovered),
    accountWide: asNullableBoolean(row.accountWide)
  };
}

function normalizeItemEntry(
  value: LuaValue
): AddonItemResourceEntry | null {
  const row = asTable(value);

  if (!row) {
    return null;
  }

  const itemId = asNumber(row.itemId);

  if (itemId === null || itemId <= 0) {
    return null;
  }

  return {
    key:
      typeof row.key === "string" && row.key.length > 0
        ? row.key
        : String(itemId),
    itemId,
    count: asNumber(row.count)
  };
}

/*
 * Returns null for a missing/absent resources module (character never
 * ran the Resources capture, or an unsupported schemaVersion) - absence
 * of a usable snapshot must never be confused with "confirmed zero
 * resources". Malformed individual rows are dropped, never fabricated
 * into a zero-value entry.
 */
export function normalizeResourceSnapshot(
  resourcesModule: LuaValue | undefined
): AddonResourceSnapshot | null {
  const module = asTable(resourcesModule);

  if (!module) {
    return null;
  }

  const schemaVersion = asNumber(module.schemaVersion) ?? 0;

  if (schemaVersion !== SUPPORTED_RESOURCE_SCHEMA_VERSION) {
    return null;
  }

  const data = asTable(module.data);

  if (!data) {
    return null;
  }

  const currencies = numericValues(asTable(data.currencies))
    .map(normalizeCurrencyEntry)
    .filter(
      (entry): entry is AddonCurrencyEntry => entry !== null
    );

  const items = numericValues(asTable(data.items))
    .map(normalizeItemEntry)
    .filter(
      (entry): entry is AddonItemResourceEntry => entry !== null
    );

  return {
    schemaVersion,
    capturedAt: unixTimestampToIso(module.capturedAt),
    currencies,
    items
  };
}
