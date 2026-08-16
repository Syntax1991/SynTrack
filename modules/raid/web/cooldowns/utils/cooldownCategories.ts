import { getSpellById } from "../../../shared/catalog/raidCooldownSpellCatalog";
import type { RaidCooldownSpellCategory } from "../../../shared/catalog/raidCooldownSpellCatalog";

export type CooldownDisplayCategory =
  | RaidCooldownSpellCategory
  | "Other";

export const cooldownDisplayCategories: CooldownDisplayCategory[] = [
  "Raid DR",
  "Heal CD",
  "External",
  "Defensive",
  "Utility",
  "Other"
];

export const cooldownCategoryLabels: Record<
  CooldownDisplayCategory,
  string
> = {
  "Heal CD": "Healing CDs",
  "Raid DR": "Raid CDs",
  External: "Externals",
  Defensive: "Personals",
  Utility: "Utility",
  Other: "Other"
};

/**
 * A free-text or uncatalogued-spellId assignment resolves to "Other"
 * — never guessed from the ability name.
 */
export function resolveAssignmentCategory(assignment: {
  spellId: number | null;
}): CooldownDisplayCategory {
  if (assignment.spellId === null) {
    return "Other";
  }

  return (
    getSpellById(assignment.spellId)
      ?.category ?? "Other"
  );
}
