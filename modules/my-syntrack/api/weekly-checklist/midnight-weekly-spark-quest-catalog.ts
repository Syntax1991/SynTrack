/**
 * Canonical Midnight Season 2 weekly Spark / META quest catalog.
 *
 * Product META = one logical weekly Spark objective per reset.
 * Multiple quest IDs are alternatives for that single obligation — not
 * separate columns and not a progress fraction across the catalog.
 *
 * Persistence remains one WEEKLY boolean tracker (`meta-quest`).
 */

export type MidnightSparkQuestFamily =
  | "UNITY_META"
  | "TRAILING_XALATATH"
  | "TURN_BACK_SURGE"
  | "SPARKS_OF_WAR"
  | "ONE_TIME"
  | "FOLLOW_UP"
  | "HISTORICAL";

export type MidnightSparkQuestRecurrence = "WEEKLY" | "ONE_TIME";

/**
 * LIVE_CURRENT — safe for product META eligibility
 * LIVE_HISTORICAL — exists but not current weekly Spark source
 * ONE_TIME — awards Spark once; never weekly META
 * FOLLOW_UP — Spark hand-in / intro; not weekly objective
 * PTR_ONLY — not safe for live product
 * UNKNOWN — insufficient evidence (never enable)
 */
export type MidnightSparkQuestClassification =
  | "LIVE_CURRENT"
  | "LIVE_HISTORICAL"
  | "ONE_TIME"
  | "FOLLOW_UP"
  | "PTR_ONLY"
  | "UNKNOWN";

/**
 * META_ALTERNATIVE — completing this quest satisfies the weekly META/Spark
 * NOT_META — tracked for classification only; must not complete META
 * STALE_TRACKER — previously used by SynTrack; do not use for META
 */
export type MidnightSparkProductRole =
  | "META_ALTERNATIVE"
  | "NOT_META"
  | "STALE_TRACKER";

export type MidnightWeeklySparkQuest = {
  questId: number;
  name: string;
  family: MidnightSparkQuestFamily;
  recurrence: MidnightSparkQuestRecurrence;
  classification: MidnightSparkQuestClassification;
  productRole: MidnightSparkProductRole;
  /** When true, included in addon OR-capture for Weeklies META. */
  enabled: boolean;
};

/**
 * Every known Midnight Spark/meta-related quest ID must appear here.
 * Do not silently omit an ID — classify it explicitly.
 */
export const MIDNIGHT_WEEKLY_SPARK_QUESTS: readonly MidnightWeeklySparkQuest[] =
  [
    // --- Unity Against the Void (parent + activity children) ---
    {
      questId: 93744,
      name: "Unity Against the Void",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93766,
      name: "Midnight: World Quests",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93767,
      name: "Midnight: Arcantina",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93769,
      name: "Midnight: Housing",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93889,
      name: "Midnight: Saltheril's Soiree",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93890,
      name: "Midnight: Abundance",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93892,
      name: "Midnight: Stormarion Assault",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93909,
      name: "Midnight: Delves",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93910,
      name: "Midnight: Prey",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93911,
      name: "Midnight: Dungeons",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93912,
      name: "Midnight: Raid",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93913,
      name: "Midnight: World Boss",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 95842,
      name: "Midnight: Void Assaults",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 95843,
      name: "Midnight: Ritual Sites",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 96727,
      name: "Midnight: Offworld Showdowns",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 98232,
      name: "Midnight: Vaults of Atal'Utek",
      family: "UNITY_META",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },

    // --- Concurrent Season 2 weekly Spark alternatives ---
    {
      questId: 98172,
      name: "Trailing Xal'atath",
      family: "TRAILING_XALATATH",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 96995,
      name: "Turn Back the Surge",
      family: "TURN_BACK_SURGE",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },

    // --- Sparks of War (PvP weekly zone rotation; same weekly Spark) ---
    {
      questId: 93423,
      name: "Sparks of War: Eversong Woods",
      family: "SPARKS_OF_WAR",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93424,
      name: "Sparks of War: Zul'Aman",
      family: "SPARKS_OF_WAR",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93425,
      name: "Sparks of War: Harandar",
      family: "SPARKS_OF_WAR",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 93426,
      name: "Sparks of War: Voidstorm",
      family: "SPARKS_OF_WAR",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 96725,
      name: "Sparks of War: Val",
      family: "SPARKS_OF_WAR",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },
    {
      questId: 96726,
      name: "Sparks of War: Naigtal",
      family: "SPARKS_OF_WAR",
      recurrence: "WEEKLY",
      classification: "LIVE_CURRENT",
      productRole: "META_ALTERNATIVE",
      enabled: true
    },

    // --- Not weekly META ---
    {
      questId: 95245,
      name: "Midnight: World Tour",
      family: "ONE_TIME",
      recurrence: "ONE_TIME",
      classification: "ONE_TIME",
      productRole: "NOT_META",
      enabled: false
    },
    {
      questId: 96446,
      name: "Spark of Tides",
      family: "FOLLOW_UP",
      recurrence: "ONE_TIME",
      classification: "FOLLOW_UP",
      productRole: "NOT_META",
      enabled: false
    },

    // --- Stale SynTrack tracker (pre-catalog single-ID capture) ---
    {
      questId: 95520,
      name: "Purging the Vaults",
      family: "HISTORICAL",
      recurrence: "WEEKLY",
      classification: "LIVE_HISTORICAL",
      productRole: "STALE_TRACKER",
      enabled: false
    }
  ] as const;

/** Quest IDs that satisfy Weeklies META when flagged complete this reset. */
export function metaEligibleSparkQuestIds(): number[] {
  return MIDNIGHT_WEEKLY_SPARK_QUESTS.filter(
    (entry) =>
      entry.enabled &&
      entry.productRole === "META_ALTERNATIVE" &&
      entry.classification === "LIVE_CURRENT" &&
      entry.recurrence === "WEEKLY"
  ).map((entry) => entry.questId);
}

export function sparkQuestById(
  questId: number
): MidnightWeeklySparkQuest | undefined {
  return MIDNIGHT_WEEKLY_SPARK_QUESTS.find(
    (entry) => entry.questId === questId
  );
}

/** Required audit coverage — every known ID must be classified. */
export const REQUIRED_SPARK_QUEST_AUDIT_IDS: readonly number[] = [
  93744, 93766, 93767, 93769, 93889, 93890, 93892, 93909, 93910, 93911,
  93912, 93913, 95245, 95842, 95843, 96446, 96727, 98172, 98232, 93423,
  93424, 93425, 93426, 96725, 96726, 95520, 96995
] as const;
