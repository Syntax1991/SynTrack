/*
 * Blizzard's playable-class ids are stable, locale-independent, and
 * unchanged since each class's introduction - unlike
 * character_class.name, which Blizzard localizes to whatever
 * BATTLENET_LOCALE is configured (this deployment runs de_DE). Mapping
 * by id to the canonical English name is what lets a Blizzard-sourced
 * profile stay compatible with the existing className contract
 * (classColors.ts and every "{character.className}" read across
 * Overview/Season/Weeklies/Characters all expect English names like
 * "Shaman", never "Schamane").
 */
const CLASS_NAME_BY_BLIZZARD_ID: Record<number, string> = {
  1: "Warrior",
  2: "Paladin",
  3: "Hunter",
  4: "Rogue",
  5: "Priest",
  6: "Death Knight",
  7: "Shaman",
  8: "Mage",
  9: "Warlock",
  10: "Monk",
  11: "Druid",
  12: "Demon Hunter",
  13: "Evoker"
};

export function resolveCanonicalClassName(
  classId: number | null | undefined
): string | null {
  if (typeof classId !== "number") {
    return null;
  }

  return CLASS_NAME_BY_BLIZZARD_ID[classId] ?? null;
}
