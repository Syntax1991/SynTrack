/*
 * Parses only the stable, always-present fields out of a WoW item
 * link/item-string - this is a plain delimited-string format, not Lua,
 * so it is deliberately not part of LuaSavedVariablesParser. The addon
 * captures the raw link and nothing else; this is the only place that
 * ever decodes it.
 *
 * Known link shape (fields after the leading "item"):
 *   itemId : enchantId : gem1 : gem2 : gem3 : gem4 : suffixId : uniqueId : ...
 *
 * Modern links omit trailing zero/empty fields entirely (e.g. "::"
 * instead of ":0:0:"), and a full hyperlink additionally wraps the item
 * string in "|Hitem:...|h[Name]|h" markup. Malformed input must never
 * throw - every field simply falls back to null/empty.
 */
export type ParsedItemLink = {
  itemId: number | null;
  enchantId: number | null;
  gemIds: number[];
};

const EMPTY_RESULT: ParsedItemLink = {
  itemId: null,
  enchantId: null,
  gemIds: []
};

function extractItemString(rawLink: string): string | null {
  const hyperlinkMatch = rawLink.match(/\|H(item:[^|]*)\|h/u);

  if (hyperlinkMatch) {
    return hyperlinkMatch[1] ?? null;
  }

  if (rawLink.startsWith("item:")) {
    return rawLink;
  }

  return null;
}

function parsePositiveInt(field: string | undefined): number | null {
  if (field === undefined || field === "") {
    return null;
  }

  const parsed = Number.parseInt(field, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function parseItemLink(
  rawLink: string | null
): ParsedItemLink {
  if (!rawLink) {
    return EMPTY_RESULT;
  }

  const itemString = extractItemString(rawLink);

  if (!itemString) {
    return EMPTY_RESULT;
  }

  const fields = itemString.split(":");

  if (fields[0] !== "item") {
    return EMPTY_RESULT;
  }

  const itemId = parsePositiveInt(fields[1]);

  if (itemId === null) {
    return EMPTY_RESULT;
  }

  const enchantId = parsePositiveInt(fields[2]);

  const gemIds = [fields[3], fields[4], fields[5], fields[6]]
    .map((field) => parsePositiveInt(field))
    .filter((gemId): gemId is number => gemId !== null);

  return { itemId, enchantId, gemIds };
}
