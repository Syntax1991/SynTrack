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

export type CooldownSpellRow<T> = {
  /**
   * Stable per (category, member, spell-identity) key — the unit a
   * Timeline row and its click-to-create state are keyed against.
   * Spell identity is the real `spellId` when known, otherwise the
   * exact free-text `abilityName` (conservative — never merges two
   * differently-named free-text entries).
   */
  key: string;
  memberId: string;
  spellId: number | null;
  abilityName: string;
  abilityIcon: string | null;
  assignments: T[];
};

export type CooldownCategoryGroup<T> = {
  category: CooldownDisplayCategory;
  label: string;
  spellRows: Array<CooldownSpellRow<T>>;
};

/**
 * The spell — not the player — is a row's primary identity. A member
 * casting the same spell repeatedly is one row with multiple
 * markers; a member holding two different spells in one category is
 * two separate rows. Rows only ever come from real assignments —
 * class eligibility (`getSpellsForClass`) plays no part here, it's
 * purely a creation-time filter applied by the caller.
 */
export function groupAssignmentsByCategory<
  T extends {
    memberId: string;
    spellId: number | null;
    abilityName: string;
    abilityIcon: string | null;
  }
>(
  assignments: T[]
): CooldownCategoryGroup<T>[] {
  return cooldownDisplayCategories.map(
    (category) => {
      const inCategory = assignments.filter(
        (assignment) =>
          resolveAssignmentCategory(
            assignment
          ) === category
      );

      const bySpellKey = new Map<
        string,
        CooldownSpellRow<T>
      >();

      for (const assignment of inCategory) {
        const spellIdentity =
          assignment.spellId !== null
            ? `spell:${assignment.spellId}`
            : `text:${assignment.abilityName}`;

        const key = `${category}::${assignment.memberId}::${spellIdentity}`;

        const existing =
          bySpellKey.get(key);

        if (existing) {
          existing.assignments.push(
            assignment
          );
        }
        else {
          bySpellKey.set(key, {
            key,
            memberId:
              assignment.memberId,
            spellId: assignment.spellId,
            abilityName:
              assignment.abilityName,
            abilityIcon:
              assignment.abilityIcon,
            assignments: [assignment]
          });
        }
      }

      return {
        category,
        label:
          cooldownCategoryLabels[
            category
          ],
        spellRows: Array.from(
          bySpellKey.values()
        )
      };
    }
  );
}
