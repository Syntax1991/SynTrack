/*
 * Canonical tracker-definition keys consumed by the Weeklies gameplay
 * signals read model. Values are recorded through CharacterTrackerValue
 * (manual or future automatic capture) — Weeklies never persists copies.
 */
export const WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY =
  "mythic-plus-rating";

export const WEEKLIES_META_QUEST_TRACKER_KEY = "meta-quest";

export const WEEKLIES_MAP_USED_TRACKER_KEY = "map-used";

export const WEEKLIES_SIGNAL_TRACKER_KEYS = [
  WEEKLIES_MYTHIC_PLUS_RATING_TRACKER_KEY,
  WEEKLIES_META_QUEST_TRACKER_KEY,
  WEEKLIES_MAP_USED_TRACKER_KEY
] as const;

export type WeekliesSignalTrackerKey =
  (typeof WEEKLIES_SIGNAL_TRACKER_KEYS)[number];
