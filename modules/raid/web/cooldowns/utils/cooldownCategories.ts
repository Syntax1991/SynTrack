import { getSpellById } from "../../../shared/catalog/raidCooldownSpellCatalog";
import type { RaidCooldownSpellCategory } from "../../../shared/catalog/raidCooldownSpellCatalog";

export type CooldownDisplayCategory =
  | RaidCooldownSpellCategory
  | "Other";

export const cooldownDisplayCategories: CooldownDisplayCategory[] = [
  "Heal CD",
  "Raid DR",
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

export type CooldownCategoryMemberGroup<T> = {
  memberId: string;
  assignments: T[];
};

export type CooldownCategoryGroup<T> = {
  category: CooldownDisplayCategory;
  label: string;
  memberGroups: Array<
    CooldownCategoryMemberGroup<T>
  >;
};

/**
 * Rows must be driven by real assignments, never by class eligibility
 * — a row rendered just because a class *can* hold a category's spell
 * is the "permanent empty row" problem this exists to remove. Class
 * eligibility (`getSpellsForClass`) stays a creation-time filter,
 * applied by the caller when deciding which not-yet-assigned members
 * to offer as a compact pick, never here.
 */
export function groupAssignmentsByCategory<
  T extends {
    memberId: string;
    spellId: number | null;
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

      const byMember = new Map<
        string,
        T[]
      >();

      for (const assignment of inCategory) {
        const existing =
          byMember.get(
            assignment.memberId
          ) ?? [];

        existing.push(assignment);
        byMember.set(
          assignment.memberId,
          existing
        );
      }

      return {
        category,
        label:
          cooldownCategoryLabels[
            category
          ],
        memberGroups: Array.from(
          byMember.entries()
        ).map(
          ([
            memberId,
            memberAssignments
          ]) => ({
            memberId,
            assignments:
              memberAssignments
          })
        )
      };
    }
  );
}
