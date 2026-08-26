/*
 * Official, stable Blizzard class colors - a small closed set (13
 * classes), exact-matched against character.className. This is not a
 * name guess: it is the same fixed color table every WoW UI/addon
 * uses. Unknown/unrecognized class names fall back to a neutral gray
 * rather than guessing a color.
 */
const CLASS_COLORS: Record<string, string> = {
  Warrior: "#C79C6E",
  Paladin: "#F58CBA",
  Hunter: "#ABD473",
  Rogue: "#FFF569",
  Priest: "#FFFFFF",
  "Death Knight": "#C41F3B",
  Shaman: "#0070DE",
  Mage: "#69CCF0",
  Warlock: "#9482C9",
  Monk: "#00FF96",
  Druid: "#FF7D0A",
  "Demon Hunter": "#A330C9",
  Evoker: "#33937F"
};

const FALLBACK_CLASS_COLOR =
  "#6b6b7a";

export function getClassColor(
  className: string
): string {
  return (
    CLASS_COLORS[className] ??
    FALLBACK_CLASS_COLOR
  );
}

export function getClassInitials(
  className: string
): string {
  return className
    .split(" ")
    .map(
      (word) => word[0]
    )
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/*
 * Compact glyphs for the small, closed set of recipe groups already
 * produced by getProfessionRecipeGroupName. An unrecognized group name
 * falls back to its own first two letters rather than a guessed
 * symbol - still deterministic, never fuzzy-matched against a
 * different group's glyph.
 */
const FAMILY_GLYPHS: Record<string, string> = {
  Leather: "L",
  Mail: "M",
  Cloth: "C",
  Plate: "P",
  Armor: "A",
  Weapons: "W",
  "Profession Gear": "PG",
  "Profession Equipment": "PE",
  "Armor Kits": "AK",
  Reagents: "R",
  Consumables: "CN",
  "House Decor": "HD"
};

export function getFamilyGlyph(
  familyName: string
): string {
  return (
    FAMILY_GLYPHS[familyName] ??
    familyName
      .slice(0, 2)
      .toUpperCase()
  );
}

const CRAFT_STATUS_GLYPHS: Record<
  string,
  string
> = {
  SAFE: "✓",
  CONCENTRATION: "◐",
  NOT_SAFE: "✕",
  UNKNOWN: "?"
};

export function getCraftStatusGlyph(
  status: string
): string {
  return (
    CRAFT_STATUS_GLYPHS[status] ??
    "?"
  );
}
