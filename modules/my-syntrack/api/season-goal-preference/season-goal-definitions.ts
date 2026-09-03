/*
 * Configurable Season goal catalog — the small set of user-facing goals a
 * Character (or the Warband) can enable/disable and target. Distinct from
 * MIDNIGHT_S2_SEASON_GOAL_CATALOG / SEASON_EVIDENCE_CATALOG, which govern
 * which underlying trackers/evidence exist at the system level and stay
 * unchanged — this catalog only describes what the USER may configure on
 * top of that already-canonical evidence. One tracked fact exists once;
 * this never stores or duplicates completion/progress.
 */

export type SeasonGoalTargetType = "NONE" | "NUMBER" | "ENUM";
export type SeasonGoalPreferenceScope = "CHARACTER" | "WARBAND";

export type SeasonGoalDefinition = {
  key: string;
  label: string;
  detail: string;
  scope: SeasonGoalPreferenceScope;
  targetType: SeasonGoalTargetType;
  defaultEnabled: boolean;
  defaultNumericTarget: number | null;
  defaultEnumTarget: string | null;
  numericPresets: number[] | null;
  enumOptions: string[] | null;
  minNumericTarget: number | null;
};

export const SEASON_RAID_ENUM_OPTIONS = ["AOTC", "CE", "OFF"] as const;
export type SeasonRaidTarget = (typeof SEASON_RAID_ENUM_OPTIONS)[number];

export const SEASON_GOAL_DEFINITIONS: SeasonGoalDefinition[] = [
  {
    key: "mythic-plus-score",
    label: "Mythic+ Score",
    detail: "Current-season Mythic+ rating toward your chosen milestone",
    scope: "CHARACTER",
    targetType: "NUMBER",
    defaultEnabled: true,
    defaultNumericTarget: 2000,
    defaultEnumTarget: null,
    numericPresets: [2000, 2500, 3000],
    enumOptions: null,
    minNumericTarget: 1
  },
  {
    key: "resilient-keystone",
    label: "Resilient Keystone",
    detail:
      "Highest Keystone floor unlocked by timing all 8 current-season dungeons at that level or higher",
    scope: "CHARACTER",
    targetType: "NUMBER",
    defaultEnabled: false,
    defaultNumericTarget: null,
    defaultEnumTarget: null,
    numericPresets: [12, 13, 14, 15],
    enumOptions: null,
    minNumericTarget: 12
  },
  {
    key: "tier-four-piece",
    label: "Tier Set",
    detail: "Current-season Tier set pieces toward 4pc",
    scope: "CHARACTER",
    targetType: "NONE",
    defaultEnabled: true,
    defaultNumericTarget: null,
    defaultEnumTarget: null,
    numericPresets: null,
    enumOptions: null,
    minNumericTarget: null
  },
  {
    key: "embellishments",
    label: "Embellishments",
    detail: "Equipped Unique-Equipped Embellishments toward Season setup",
    scope: "CHARACTER",
    targetType: "NONE",
    defaultEnabled: true,
    defaultNumericTarget: null,
    defaultEnumTarget: null,
    numericPresets: null,
    enumOptions: null,
    minNumericTarget: null
  },
  {
    key: "cracked-keystone",
    label: "Cracked Keystone",
    detail: "Complete the Season 2 Cracked Keystone quest",
    scope: "CHARACTER",
    targetType: "NONE",
    defaultEnabled: true,
    defaultNumericTarget: null,
    defaultEnumTarget: null,
    numericPresets: null,
    enumOptions: null,
    minNumericTarget: null
  },
  {
    key: "nemesis",
    label: "Nemesis: Azta'rec",
    detail: "Defeat Azta'rec during Midnight Season 2",
    scope: "CHARACTER",
    targetType: "NONE",
    defaultEnabled: true,
    defaultNumericTarget: null,
    defaultEnumTarget: null,
    numericPresets: null,
    enumOptions: null,
    minNumericTarget: null
  },
  {
    key: "raid",
    label: "Raid",
    detail: "Ula'tek raid milestones for Midnight Season 2",
    scope: "CHARACTER",
    targetType: "ENUM",
    defaultEnabled: true,
    defaultNumericTarget: null,
    defaultEnumTarget: "AOTC",
    numericPresets: null,
    enumOptions: [...SEASON_RAID_ENUM_OPTIONS],
    minNumericTarget: null
  },
  {
    key: "portals",
    label: "Dungeon Portals",
    detail: "Timed +10 dungeon portals for Midnight Season 2 (Warband-wide)",
    scope: "WARBAND",
    targetType: "NONE",
    defaultEnabled: true,
    defaultNumericTarget: null,
    defaultEnumTarget: null,
    numericPresets: null,
    enumOptions: null,
    minNumericTarget: null
  },
  {
    key: "valeera-80",
    label: "Valeera 80",
    detail: "Reach level 80 (Warband-wide)",
    scope: "WARBAND",
    targetType: "NONE",
    defaultEnabled: true,
    defaultNumericTarget: null,
    defaultEnumTarget: null,
    numericPresets: null,
    enumOptions: null,
    minNumericTarget: null
  }
];

export function findSeasonGoalDefinition(
  goalKey: string
): SeasonGoalDefinition | null {
  return (
    SEASON_GOAL_DEFINITIONS.find((definition) => definition.key === goalKey) ??
    null
  );
}

export function characterSeasonGoalDefinitions(): SeasonGoalDefinition[] {
  return SEASON_GOAL_DEFINITIONS.filter(
    (definition) => definition.scope === "CHARACTER"
  );
}

export function warbandSeasonGoalDefinitions(): SeasonGoalDefinition[] {
  return SEASON_GOAL_DEFINITIONS.filter(
    (definition) => definition.scope === "WARBAND"
  );
}
