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

export type PlayerSpellRow<T> = {
  /**
   * Stable per (member, spell-identity) key. Spell identity is the
   * real `spellId` when known, otherwise the exact free-text
   * `abilityName` (conservative — never merges two differently-named
   * free-text entries).
   */
  key: string;
  spellId: number | null;
  abilityName: string;
  abilityIcon: string | null;
  assignments: T[];
};

export type PlayerGroup<T> = {
  memberId: string;
  spellRows: Array<PlayerSpellRow<T>>;
};

/**
 * The player is the group; the spell is the lane inside it — never
 * the other way around. The category filter (when set) narrows which
 * real assignments are considered at all, but never becomes a
 * structural grouping level of its own: a player group only appears
 * here when they have at least one real assignment matching the
 * filter, and only that assignment's spell lane(s) render under
 * them. Rows only ever come from real assignments; class eligibility
 * plays no part in this function at all.
 */
export function groupAssignmentsByPlayer<
  T extends {
    memberId: string;
    spellId: number | null;
    abilityName: string;
    abilityIcon: string | null;
  }
>(
  assignments: T[],
  categoryFilter?: CooldownDisplayCategory
): Array<PlayerGroup<T>> {
  const filtered = categoryFilter
    ? assignments.filter(
        (assignment) =>
          resolveAssignmentCategory(
            assignment
          ) === categoryFilter
      )
    : assignments;

  const rowsByMember = new Map<
    string,
    Map<string, PlayerSpellRow<T>>
  >();

  for (const assignment of filtered) {
    const spellIdentity =
      assignment.spellId !== null
        ? `spell:${assignment.spellId}`
        : `text:${assignment.abilityName}`;

    const rowKey = `${assignment.memberId}::${spellIdentity}`;

    const memberRows =
      rowsByMember.get(
        assignment.memberId
      ) ?? new Map();

    const existingRow =
      memberRows.get(rowKey);

    if (existingRow) {
      existingRow.assignments.push(
        assignment
      );
    }
    else {
      memberRows.set(rowKey, {
        key: rowKey,
        spellId: assignment.spellId,
        abilityName:
          assignment.abilityName,
        abilityIcon:
          assignment.abilityIcon,
        assignments: [assignment]
      });
    }

    rowsByMember.set(
      assignment.memberId,
      memberRows
    );
  }

  return Array.from(
    rowsByMember.entries()
  ).map(([memberId, rows]) => ({
    memberId,
    spellRows: Array.from(
      rows.values()
    )
  }));
}
