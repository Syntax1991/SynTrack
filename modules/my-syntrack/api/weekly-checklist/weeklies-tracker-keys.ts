/*
 * Canonical tracker-definition keys consumed by the Weeklies gameplay
 * signals read model. Values are recorded through CharacterTrackerValue
 * (manual or future automatic capture) — Weeklies never persists copies.
 */
export const WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY =
  "mythic-plus-rating";

export const WEEKLIES_META_QUEST_TRACKER_KEY = "meta-quest";

export const WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY =
  "trove-hunters-bounty-used";

export const WEEKLIES_SIGNAL_TRACKER_KEYS = [
  WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
  WEEKLIES_META_QUEST_TRACKER_KEY,
  WEEKLIES_TROVE_HUNTERS_BOUNTY_TRACKER_KEY
] as const;

export type WeekliesSignalTrackerKey =
  (typeof WEEKLIES_SIGNAL_TRACKER_KEYS)[number];

export const WEEKLIES_MAP_DELVE_REQUIREMENT = 8;

export const WEEKLIES_MAP_MEANING =
  "Trove Hunter's Bounty used and ≥8 Delves completed this week";
