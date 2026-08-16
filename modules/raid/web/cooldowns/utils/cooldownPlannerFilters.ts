import { getSpellsForClass } from "../../../shared/catalog/raidCooldownSpellCatalog.js";
import type { CooldownDisplayCategory } from "./cooldownCategories.js";
import { resolveAssignmentCategory } from "./cooldownCategories.js";

export type PlanAssignmentLike = {
  memberId: string;
  spellId: number | null;
  abilityName: string;
  abilityIcon: string | null;
};

export type PlayerPlanLane<T> = {
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
  category: CooldownDisplayCategory;
  assignments: T[];
};

/**
 * Every real class spell becomes a lane up front — even with zero
 * assignments — because being a Cooldown Plan Participant means
 * "these lanes are ready to plan", not "these spells happen to have
 * a marker already". Any assignment whose spell isn't in the catalog
 * (an uncatalogued spellId, or free-text) still gets its own lane, so
 * no existing RaidCooldownAssignment ever loses its row. Never
 * invents a spell: only getSpellsForClass entries and real
 * assignments produce lanes.
 */
export function buildPlayerPlanLanes<
  T extends PlanAssignmentLike
>(
  memberId: string,
  className: string,
  allAssignments: T[]
): PlayerPlanLane<T>[] {
  const memberAssignments =
    allAssignments.filter(
      (assignment) =>
        assignment.memberId === memberId
    );

  const catalogSpells =
    getSpellsForClass(className);

  const catalogSpellIds = new Set(
    catalogSpells.map(
      (spell) => spell.spellId
    )
  );

  const catalogLanes: Array<
    PlayerPlanLane<T>
  > = catalogSpells.map((spell) => ({
    key: `spell:${spell.spellId}`,
    spellId: spell.spellId,
    abilityName: spell.name,
    abilityIcon: spell.icon,
    category: spell.category,
    assignments:
      memberAssignments.filter(
        (assignment) =>
          assignment.spellId ===
          spell.spellId
      )
  }));

  const orphanLanes = new Map<
    string,
    PlayerPlanLane<T>
  >();

  for (const assignment of memberAssignments) {
    if (
      assignment.spellId !== null &&
      catalogSpellIds.has(
        assignment.spellId
      )
    ) {
      continue;
    }

    const identity =
      assignment.spellId !== null
        ? `spell:${assignment.spellId}`
        : `text:${assignment.abilityName}`;

    const existing =
      orphanLanes.get(identity);

    if (existing) {
      existing.assignments.push(
        assignment
      );
    }
    else {
      orphanLanes.set(identity, {
        key: identity,
        spellId: assignment.spellId,
        abilityName:
          assignment.abilityName,
        abilityIcon:
          assignment.abilityIcon,
        category:
          resolveAssignmentCategory(
            assignment
          ),
        assignments: [assignment]
      });
    }
  }

  return [
    ...catalogLanes,
    ...Array.from(orphanLanes.values())
  ];
}

type LaneVisibilityOptions = {
  activeCategory: CooldownDisplayCategory | "all";
  hiddenSpellIds: Set<number>;
  alwaysShowAssigned: boolean;
};

/**
 * Always Show Assigned is a safety net for content that's already
 * planned, not a way to see everything regardless of filters: a lane
 * with zero real assignments still obeys category/hidden filtering
 * normally. Only a lane carrying >=1 real assignment gets the
 * override, and only for the exact filter it would otherwise fail —
 * so this never fabricates or reveals a lane the player hasn't
 * actually used.
 */
export function isLaneVisible(
  lane: {
    category: CooldownDisplayCategory;
    spellId: number | null;
    assignments: unknown[];
  },
  options: LaneVisibilityOptions
): boolean {
  const hasAssignment =
    lane.assignments.length > 0;

  const safetyOverride =
    options.alwaysShowAssigned &&
    hasAssignment;

  const categoryMatches =
    options.activeCategory === "all" ||
    lane.category ===
      options.activeCategory;

  if (
    !categoryMatches &&
    !safetyOverride
  ) {
    return false;
  }

  const isHiddenSpell =
    lane.spellId !== null &&
    options.hiddenSpellIds.has(
      lane.spellId
    );

  if (isHiddenSpell && !safetyOverride) {
    return false;
  }

  return true;
}

type PlayerVisibilityOptions = {
  selectedMemberId: string | null;
  hiddenMemberIds: Set<string>;
  alwaysShowAssigned: boolean;
};

/**
 * Same safety-net rule at the player level: a hidden plan participant
 * with zero real assignments has nothing to protect, so Always Show
 * Assigned never reveals them — only a hidden player who already has
 * >=1 real assignment gets the override.
 */
export function isPlayerVisible(
  memberId: string,
  hasAnyAssignment: boolean,
  options: PlayerVisibilityOptions
): boolean {
  if (
    options.selectedMemberId !== null &&
    options.selectedMemberId !== memberId
  ) {
    return false;
  }

  if (
    !options.hiddenMemberIds.has(memberId)
  ) {
    return true;
  }

  return (
    options.alwaysShowAssigned &&
    hasAnyAssignment
  );
}
