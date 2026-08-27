import type {
  LuaTable,
  LuaValue
} from "./addon-import.types.js";

const professionKeys:
  Record<string, string> = {
    alchemy: "alchemy",
    blacksmithing: "blacksmithing",
    enchanting: "enchanting",
    engineering: "engineering",
    inscription: "inscription",
    jewelcrafting: "jewelcrafting",
    leatherworking: "leatherworking",
    tailoring: "tailoring",
    herbalism: "herbalism",
    mining: "mining",
    skinning: "skinning"
  };

export function asTable(
  value:
    LuaValue | undefined
): LuaTable | null {
  return (
    typeof value === "object" &&
    value !== null
  )
    ? value
    : null;
}

export function asString(
  value:
    LuaValue | undefined
): string | null {
  return typeof value === "string"
    ? value
    : null;
}

export function asNumber(
  value:
    LuaValue | undefined
): number | null {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  )
    ? value
    : null;
}

export function asBoolean(
  value:
    LuaValue | undefined
): boolean {
  return value === true;
}

export function numericValues(
  table:
    LuaTable | null
): LuaValue[] {
  if (!table) {
    return [];
  }

  return Object.entries(table)
    .filter(
      ([key]) =>
        /^\d+$/u.test(key)
    )
    .sort(
      ([left], [right]) =>
        Number(left) -
        Number(right)
    )
    .map(
      ([, value]) =>
        value
    );
}

export function unixTimestampToIso(
  value:
    LuaValue | undefined
): string | null {
  const seconds =
    asNumber(value);

  if (
    seconds === null ||
    seconds <= 0
  ) {
    return null;
  }

  const date =
    new Date(
      seconds * 1000
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

export function normalizeProfessionKey(
  name: string
): string | null {
  return (
    professionKeys[
      name
        .trim()
        .toLowerCase()
    ] ??
    null
  );
}

export function inferProfessionKeyFromName(
  displayName: string
): string | null {
  const normalized =
    displayName
      .trim()
      .toLowerCase();

  for (
    const [
      professionName,
      professionKey
    ] of
    Object.entries(
      professionKeys
    )
  ) {
    if (
      normalized === professionName ||
      normalized.endsWith(
        ` ${professionName}`
      )
    ) {
      return professionKey;
    }
  }

  return null;
}