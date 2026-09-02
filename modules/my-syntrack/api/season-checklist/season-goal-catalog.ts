/*
 * Season 2 goal catalog — orchestration metadata only.
 * Completion is never stored here; enabled goals consume canonical
 * CharacterTrackerValue / other domain facts. Disabled entries document
 * capture gaps until evidence exists (UNKNOWN > WRONG).
 *
 * Lifecycle distinction:
 *   SOURCE FACT LIFECYCLE  ≠  SEASON CHECKLIST GOAL LIFECYCLE
 * Example: individual dungeon portal achievements are permanent facts,
 * but "complete this season's portal set" is a SEASONAL checklist goal.
 * resetBehavior describes the checklist goal, not the raw evidence.
 *
 * Unsupported capture ≠ incomplete player state. Disabled rows stay
 * internal (tests / future enablement) and must not appear as user
 * checklist rows or "capture pending" product UI.
 */

export type SeasonGoalScope = "CHARACTER" | "WARBAND";
export type SeasonGoalCategory =
  | "CORE"
  | "MYTHIC_PLUS"
  | "RAID"
  | "DELVES"
  | "WARBAND";

/**
 * Checklist-goal lifecycle. Use UNRESOLVED when capture/game semantics
 * do not yet justify asserting WEEKLY / SEASONAL / PERMANENT.
 */
export type SeasonGoalResetBehavior =
  | "WEEKLY"
  | "SEASONAL"
  | "PERMANENT"
  | "UNRESOLVED";

export type SeasonGoalCatalogEntry = {
  key: string;
  title: string;
  category: SeasonGoalCategory;
  scope: SeasonGoalScope;
  resetBehavior: SeasonGoalResetBehavior;
  enabled: boolean;
  captureGap: string | null;
};

export const MIDNIGHT_S2_SEASON_GOAL_CATALOG: SeasonGoalCatalogEntry[] = [
  {
    key: "rating-2000",
    title: "Mythic+ 2,000 (Keystone Master)",
    category: "MYTHIC_PLUS",
    scope: "CHARACTER",
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "portals",
    title: "Dungeon portals (+10 timed)",
    category: "MYTHIC_PLUS",
    scope: "CHARACTER",
    // Season portal-set goal is seasonal; underlying portal achievements
    // remain permanent source facts once capture exists.
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "No achievement capture for timed +10 portals"
  },
  {
    key: "serpent-scion",
    title: "Serpent Scion / season catalyst milestone",
    category: "CORE",
    scope: "CHARACTER",
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap:
      "Need achievement evidence (OR of 2K / Heroic Ula'tek / 1600 PvP)"
  },
  {
    key: "cracked-keystone",
    title: "Cracked Keystone",
    category: "DELVES",
    scope: "CHARACTER",
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "Quest ID + seasonal quest-flag capture not in repo"
  },
  {
    key: "nemesis-aztarec",
    title: "Azta'rec (Nemesis)",
    category: "DELVES",
    scope: "CHARACTER",
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "No Nemesis achievement/quest/kill capture"
  },
  {
    key: "aotc-ulatek",
    title: "AOTC: Ula'tek",
    category: "RAID",
    scope: "CHARACTER",
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "No achievement capture; weekly raid lockout ≠ AOTC"
  },
  {
    key: "ce-ulatek",
    title: "Cutting Edge: Ula'tek",
    category: "RAID",
    scope: "CHARACTER",
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "No achievement capture"
  },
  {
    key: "tier-visual",
    title: "Season tier visual (Sssensational!)",
    category: "WARBAND",
    scope: "WARBAND",
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "No achievement capture; CharacterTrackerValue is not warband-scoped"
  },
  {
    key: "delvers-journey",
    title: "Delver's Journey",
    category: "WARBAND",
    scope: "WARBAND",
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "No Delver's Journey rank capture or warband progress store"
  },
  {
    key: "valeera-80",
    title: "Valeera level 80",
    category: "WARBAND",
    scope: "WARBAND",
    // No companion capture yet — do not assert PERMANENT/SEASONAL.
    resetBehavior: "UNRESOLVED",
    enabled: false,
    captureGap:
      "No companion/follower level capture; lifecycle unresolved until evidence exists"
  }
];

export function enabledCharacterSeasonGoals() {
  return MIDNIGHT_S2_SEASON_GOAL_CATALOG.filter(
    (entry) => entry.enabled && entry.scope === "CHARACTER"
  );
}

export function warbandSeasonGoalGaps() {
  return MIDNIGHT_S2_SEASON_GOAL_CATALOG.filter(
    (entry) => entry.scope === "WARBAND"
  );
}

export function blockedCharacterSeasonGoalGaps() {
  return MIDNIGHT_S2_SEASON_GOAL_CATALOG.filter(
    (entry) => !entry.enabled && entry.scope === "CHARACTER"
  );
}

/** Live warband goals only — disabled gaps are not product state. */
export function enabledWarbandSeasonGoals() {
  return MIDNIGHT_S2_SEASON_GOAL_CATALOG.filter(
    (entry) => entry.enabled && entry.scope === "WARBAND"
  );
}
