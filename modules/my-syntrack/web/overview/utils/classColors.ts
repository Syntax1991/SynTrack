/*
 * Standard WoW class colors (the same palette Blizzard's own UI and
 * every class-color addon/website uses) - public, stable game data,
 * not tied to any specific API version.
 */
const classColors: Record<
  string,
  string
> = {
  "Death Knight": "#C41F3B",
  "Demon Hunter": "#A330C9",
  Druid: "#FF7D0A",
  Evoker: "#33937F",
  Hunter: "#AAD372",
  Mage: "#3FC7EB",
  Monk: "#00FF98",
  Paladin: "#F58CBA",
  Priest: "#E6E6E6",
  Rogue: "#FFF468",
  Shaman: "#0070DD",
  Warlock: "#8788EE",
  Warrior: "#C69B6D"
};

export function getClassColor(
  className: string
): string {
  return (
    classColors[className] ??
    "var(--text)"
  );
}
