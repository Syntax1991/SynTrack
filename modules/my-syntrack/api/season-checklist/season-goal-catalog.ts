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
    key: "tier-4pc",
    title: "Current-season 4pc Tier Set",
    category: "CORE",
    scope: "CHARACTER",
    // Derived from Gear ACTIVE_TIER_SET_IDS / deriveTierOverviewState.
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "embellishments",
    title: "Embellishment setup",
    category: "CORE",
    scope: "CHARACTER",
    // Derived from Gear Unique-Equipped category 512 / deriveEmbellishmentOverviewState.
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "portals",
    title: "Dungeon portals (+10 timed)",
    category: "MYTHIC_PLUS",
    scope: "CHARACTER",
    // Verified achievements 62437-62444.
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "serpent-scion",
    title: "Serpent Scion",
    category: "CORE",
    scope: "CHARACTER",
    // Verified achievement 62872 (Midnight Season 2: Serpent Scion).
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "cracked-keystone",
    title: "Cracked Keystone",
    category: "DELVES",
    scope: "CHARACTER",
    // Verified Midnight Season 2 quest 97910.
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "nemesis-aztarec",
    title: "Azta'rec (Nemesis)",
    category: "DELVES",
    scope: "CHARACTER",
    // Verified achievement 63326 (My Venomous Nemesis).
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "nemesis-aztarec-solo",
    title: "Let Me Solo Him: Azta'rec",
    category: "DELVES",
    scope: "CHARACTER",
    // Verified achievement 63333; intentionally disabled stretch goal.
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap: "Stretch solo goal is not part of the product checklist"
  },
  {
    key: "aotc-ulatek",
    title: "AOTC: Ula'tek",
    category: "RAID",
    scope: "CHARACTER",
    // Verified achievement 63650.
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "ce-ulatek",
    title: "Cutting Edge: Ula'tek",
    category: "RAID",
    scope: "CHARACTER",
    // Verified achievement 63651.
    resetBehavior: "SEASONAL",
    enabled: true,
    captureGap: null
  },
  {
    key: "tier-visual",
    title: "Sssensational!",
    category: "WARBAND",
    scope: "WARBAND",
    // Verified Warband achievement 63473 — capture may remain; product goal off.
    resetBehavior: "SEASONAL",
    enabled: false,
    captureGap:
      "Cosmetic tier visual unlock is not part of the primary Season checklist"
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
